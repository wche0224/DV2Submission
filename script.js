
async function renderChart(elementId, jsonPath) {
  try {
    const response = await fetch(jsonPath);

    if (!response.ok) {
      throw new Error(
        `Could not load ${jsonPath}`
      );
    }

    const spec = await response.json();

    await vegaEmbed(`#${elementId}`, spec, {
      actions: false,
      renderer: "svg"
    });

  } catch (error) {
    console.error(error);

    document.getElementById(elementId)
      .textContent = "Unable to load chart.";
  }
}

// Chart 1: Character debuts
renderChart(
  "chart-debuts",
  "charts/debuts_comparison.json"
);

// Chart 2: Alignment heatmap
renderChart(
  "chart-alignment",
  "charts/alignment_heatmap.json"
);

// Chart 3: Alignment Streamgraph
renderChart(
  "chart-streamgraph",
  "charts/alignment_streamgraph.json"
);

// Chart 4: Character Ranking
renderChart(
  "chart-ranking",
  "charts/character_ranking.json"
);

// Map 1: World Publisher Choropleth
renderChart(
  "map-publishers",
  "charts/publisher_choropleth.json"
);


// Map 2: Publisher Headquarters
renderChart(
  "map-publisher-symbols",
  "charts/publisher_symbols.json"
);


// Map 3: Hexbin Density Map
renderChart(
  "map-publisher-hexbin",
  "charts/publisher_hexbin.json"
);


// Chart 8: Character Appearance Box Plot
renderChart(
  "chart-boxplot",
  "charts/appearance_boxplot.json"
);

// Chart 9: Character Appearance Concentration
renderChart(
  "chart-concentration",
  "charts/appearance_concentration.json"
);


async function showDebutInsight() {
  const element = document.getElementById(
    "debuts-insight"
  );

  if (!element) return;

  try {
    const response = await fetch(
      "data/debuts_by_decade.json"
    );

    if (!response.ok) {
      throw new Error("Could not load debut data");
    }

    const data = await response.json();

    const decades = {};

    // Organise counts by decade and publisher
    data.forEach(row => {
      const decade = Number(row.decade);

      if (!decades[decade]) {
        decades[decade] = {};
      }

      decades[decade][row.publisher] =
        Number(row.characters);
    });

    let largest = null;

    for (const [decade, counts] of
      Object.entries(decades)) {

      if (
        !Number.isFinite(counts.Marvel) ||
        !Number.isFinite(counts.DC)
      ) {
        continue;
      }

      const difference = Math.abs(
        counts.Marvel - counts.DC
      );

      if (!largest || difference > largest.difference) {
        largest = {
          decade,
          difference,
          marvel: counts.Marvel,
          dc: counts.DC
        };
      }
    }

    if (!largest) {
      throw new Error("No comparable decades");
    }

    const leader =
      largest.marvel > largest.dc
        ? "Marvel"
        : largest.dc > largest.marvel
          ? "DC"
          : "Neither publisher";

    const formatter = new Intl.NumberFormat("en-MY");

    if (largest.difference === 0) {
      element.textContent =
        "Marvel and DC have equal recorded counts " +
        "across all comparable decades.";
    } else {
      element.textContent =
        ` The ${largest.decade}s ` +
        `show the largest recorded difference. ` +
        `${leader} leads by ` +
        `${formatter.format(largest.difference)} ` +
        `character entries.`;
    }

  } catch (error) {
    console.error(error);

    element.textContent =
      "Insight unavailable. Please check the data.";
  }
}

showDebutInsight();


async function showAlignmentInsight() {
  const element = document.getElementById(
    "alignment-insight"
  );

  if (!element) return;

  try {
    const response = await fetch(
      "data/alignment_by_decade.json"
    );

    if (!response.ok) {
      throw new Error("Alignment data unavailable");
    }

    const data = await response.json();
    const summaries = [];

    for (const publisher of ["Marvel", "DC"]) {
      const totals = {};

      for (const row of data) {
        if (row.publisher !== publisher) continue;

        const alignment = row.alignment;

        totals[alignment] =
          (totals[alignment] || 0) +
          Number(row.characters);
      }

      const entries = Object.entries(totals);

      if (entries.length === 0) continue;

      entries.sort((a, b) => b[1] - a[1]);

      const [leadingAlignment, leadingCount] =
        entries[0];

      const total = entries.reduce(
        (sum, entry) => sum + entry[1],
        0
      );

      const percentage =
        (leadingCount / total * 100).toFixed(1);

      summaries.push(
        `${publisher}: ${leadingAlignment} ` +
        `characters account for ${percentage}%`
      );
    }

    element.textContent =
      " " +
      summaries.join("; ") +
      " of recorded character entries.";

  } catch (error) {
    console.error(error);
    element.textContent =
      "Alignment insight unavailable.";
  }
}

showAlignmentInsight();


async function showStreamgraphInsight() {
  const element = document.getElementById(
    "streamgraph-insight"
  );

  if (!element) return;

  try {
    const response = await fetch(
      "data/alignment_by_decade.json"
    );

    if (!response.ok) {
      throw new Error("Unable to load alignment data");
    }

    const data = await response.json();

    const validAlignments = [
      "Good",
      "Bad",
      "Neutral"
    ];

    const insights = [];

    for (const publisher of ["Marvel", "DC"]) {
      const decadeTotals = {};

      for (const row of data) {
        if (row.publisher !== publisher) continue;

        if (!validAlignments.includes(row.alignment)) {
          continue;
        }

        const decade = Number(row.decade);
        const count = Number(row.characters);

        if (
          !Number.isFinite(decade) ||
          !Number.isFinite(count)
        ) {
          continue;
        }

        decadeTotals[decade] =
          (decadeTotals[decade] || 0) + count;
      }

      const decades = Object.entries(decadeTotals);

      if (!decades.length) continue;

      decades.sort(
        (a, b) => b[1] - a[1]
      );

      const [peakDecade, peakCount] = decades[0];

      insights.push(
        `${publisher} peaked in the ${peakDecade}s ` +
        `with ${peakCount.toLocaleString()} ` +
        `recorded character debuts`
      );
    }

    element.textContent = insights.length
      ? " " + insights.join(". ") + "."
      : "No comparable debut records available.";

  } catch (error) {
    console.error(error);

    element.textContent =
      "Unable to calculate character debut insights.";
  }
}

showStreamgraphInsight();


async function showRankingInsight() {
  const element = document.getElementById(
    "ranking-insight"
  );

  if (!element) return;

  try {
    const response = await fetch(
      "data/top_characters.json"
    );

    if (!response.ok) {
      throw new Error("Character data unavailable");
    }

    const data = await response.json();
    const insights = [];

    for (const publisher of ["Marvel", "DC"]) {

      const characters = data
        .filter(row =>
          row.publisher === publisher &&
          Number.isFinite(Number(row.appearances))
        )
        .sort(
          (a, b) =>
            Number(b.appearances) -
            Number(a.appearances)
        );

      if (characters.length === 0) continue;

      const top = characters[0];

      insights.push(
        `${publisher}'s most frequently recorded ` +
        `character is ${top.name}, with ` +
        `${Number(top.appearances).toLocaleString("en-MY")} ` +
        `appearances`
      );
    }

    element.textContent = insights.length
      ? " " + insights.join(". ") + "."
      : "No character rankings available.";

  } catch (error) {
    console.error(error);

    element.textContent =
      "Unable to calculate character rankings.";
  }
}

showRankingInsight();


async function showChoroplethInsight() {
  const element = document.getElementById(
    "choropleth-insight"
  );

  if (!element) return;

  try {
    const response = await fetch(
      "data/publisher_countries.json"
    );

    if (!response.ok) {
      throw new Error("Publisher data unavailable");
    }

    const data = await response.json();

    const countries = data
      .filter(row =>
        Number.isFinite(Number(row.publishers)) &&
        Number(row.publishers) > 0
      )
      .sort(
        (a, b) =>
          Number(b.publishers) -
          Number(a.publishers)
      );

    if (countries.length === 0) {
      throw new Error("No valid publisher counts");
    }

    const top = countries[0];

    const formatter = new Intl.NumberFormat("en-MY");

    element.textContent =
      ` ${top.country} has the ` +
      `highest count among ${countries.length} ` +
      `countries with matching Wikidata records, ` +
      `with ${formatter.format(top.publishers)} ` +
      `recorded comic publishers.`;

  } catch (error) {
    console.error(error);

    element.textContent =
      "Unable to calculate publisher insights.";
  }
}

showChoroplethInsight();


async function showSymbolMapInsight() {
  const element = document.getElementById(
    "symbol-map-insight"
  );

  if (!element) return;

  try {
    const response = await fetch(
      "data/publisher_locations.json"
    );

    if (!response.ok) {
      throw new Error("Location data unavailable");
    }

    const data = await response.json();

    const locations = data
      .filter(row =>
        Number.isFinite(Number(row.publishers)) &&
        Number(row.publishers) > 0
      )
      .sort(
        (a, b) =>
          Number(b.publishers) -
          Number(a.publishers)
      );

    if (!locations.length) {
      throw new Error("No valid locations");
    }

    const top = locations[0];

    const count = Number(
      top.publishers
    ).toLocaleString("en-MY");

    element.textContent =
      ` ${top.city} has the highest ` +
      `count among the ${locations.length} ` +
      `recorded headquarters locations, ` +
      `with ${count} publisher associations.`;

  } catch (error) {
    console.error(error);

    element.textContent =
      "Unable to calculate headquarters insights.";
  }
}

showSymbolMapInsight();


async function showHexbinInsight() {
  const element = document.getElementById(
    "hexbin-insight"
  );

  if (!element) return;

  try {
    const response = await fetch(
      "data/publisher_hexbins.geojson"
    );

    if (!response.ok) {
      throw new Error("Hexbin data unavailable");
    }

    const geojson = await response.json();

    const features = (geojson.features || [])
      .filter(feature =>
        Number.isFinite(
          Number(feature.properties?.publishers)
        ) &&
        Number(feature.properties.publishers) > 0
      );

    if (!features.length) {
      throw new Error("No valid hexagons");
    }

    // Find the hexagon with the largest count
    const top = features.reduce((best, current) =>
      Number(current.properties.publishers) >
      Number(best.properties.publishers)
        ? current
        : best
    );

    // Calculate total mapped associations
    const total = features.reduce(
      (sum, feature) =>
        sum + Number(feature.properties.publishers),
      0
    );

    const topCount = Number(
      top.properties.publishers
    );

    const percentage = (
      topCount / total * 100
    ).toFixed(1);

    const cities = top.properties.example_cities;

    const locationText = cities
      ? ` Example headquarters locations: ${cities}.`
      : "";

    element.textContent =
      ` A highest-density hexagon ` +
      `contains ${topCount.toLocaleString("en-MY")} ` +
      `publisher-headquarters associations, ` +
      `representing ${percentage}% of all ` +
      `mapped associations.` +
      locationText;

  } catch (error) {
    console.error(error);

    element.textContent =
      "Unable to calculate hexbin insights.";
  }
}

showHexbinInsight();

async function showBoxplotInsight() {
  const element = document.getElementById(
    "boxplot-insight"
  );

  if (!element) return;

  try {
    const response = await fetch(
      "data/appearance_records.json"
    );

    if (!response.ok) {
      throw new Error("Appearance data unavailable");
    }

    const data = await response.json();

    const validAlignments = [
      "Good",
      "Bad",
      "Neutral"
    ];

    function median(values) {
      const sorted = [...values].sort(
        (a, b) => a - b
      );

      const middle = Math.floor(
        sorted.length / 2
      );

      if (sorted.length % 2 === 0) {
        return (
          sorted[middle - 1] +
          sorted[middle]
        ) / 2;
      }

      return sorted[middle];
    }

    const summaries = [];

    for (const publisher of ["Marvel", "DC"]) {

      const groups = {};

      for (const alignment of validAlignments) {
        groups[alignment] = [];
      }

      for (const row of data) {
        if (row.publisher !== publisher) continue;

        if (!validAlignments.includes(row.alignment)) {
          continue;
        }

        const count = Number(row.appearances);

        if (Number.isFinite(count) && count > 0) {
          groups[row.alignment].push(count);
        }
      }

      const results = validAlignments
        .filter(alignment =>
          groups[alignment].length > 0
        )
        .map(alignment => ({
          alignment,
          median: median(groups[alignment]),
          count: groups[alignment].length
        }));

      if (!results.length) continue;

      results.sort(
        (a, b) => b.median - a.median
      );

      const highest = results[0];

      const formattedMedian =
        highest.median.toLocaleString("en-MY", {
          maximumFractionDigits: 1
        });

      summaries.push(
        `${publisher}: ${highest.alignment} ` +
        `characters have the highest median ` +
        `(${formattedMedian} appearances, ` +
        `${highest.count.toLocaleString("en-MY")} records)`
      );
    }

    element.textContent = summaries.length
      ? " " + summaries.join(". ") + "."
      : "No valid appearance data available.";

  } catch (error) {
    console.error(error);

    element.textContent =
      "Unable to calculate appearance insights.";
  }
}

showBoxplotInsight();

async function showConcentrationInsight() {
  const element = document.getElementById(
    "concentration-insight"
  );

  if (!element) return;

  try {
    const response = await fetch(
      "data/appearance_concentration.json"
    );

    if (!response.ok) {
      throw new Error("Concentration data unavailable");
    }

    const data = await response.json();

    const marvel = data.find(row =>
      row.publisher === "Marvel" &&
      Number(row.top_pct) === 10
    );

    const dc = data.find(row =>
      row.publisher === "DC" &&
      Number(row.top_pct) === 10
    );

    if (!marvel || !dc) {
      throw new Error("Top 10% data missing");
    }

    const marvelShare = Number(marvel.share);
    const dcShare = Number(dc.share);

    if (
      !Number.isFinite(marvelShare) ||
      !Number.isFinite(dcShare)
    ) {
      throw new Error("Invalid appearance shares");
    }

    const percentage = new Intl.NumberFormat(
      "en-MY",
      {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    );

    const difference = Math.abs(
      marvelShare - dcShare
    ) * 100;

    let comparison;

    if (difference < 0.05) {
      comparison =
        "Both publishers show similar concentration.";
    } else {
      const leader = marvelShare > dcShare
        ? "Marvel"
        : "DC";

      comparison =
        `${leader} shows greater concentration ` +
        `by ${difference.toFixed(1)} percentage points.`;
    }

    element.textContent =
      " The top 10% of recorded " +
      "characters account for " +
      `${percentage.format(marvelShare)} of Marvel ` +
      `appearances and ${percentage.format(dcShare)} ` +
      `of DC appearances. ${comparison}`;

  } catch (error) {
    console.error(error);

    element.textContent =
      "Unable to calculate concentration insights.";
  }
}

showConcentrationInsight();

renderChart(
  "chart-mosaic",
  "charts/publisher_alignment_mosaic.json"
);

async function showMosaicInsight() {
  const element = document.getElementById(
    "mosaic-insight"
  );

  if (!element) return;

  try {
    const response = await fetch(
      "data/publisher_alignment_mosaic.json"
    );

    if (!response.ok) {
      throw new Error("Mosaic data unavailable");
    }

    const data = await response.json();

    const marvel = data.find(row =>
      row.publisher === "Marvel" &&
      row.alignment === "Good"
    );

    const dc = data.find(row =>
      row.publisher === "DC" &&
      row.alignment === "Good"
    );

    if (!marvel || !dc) {
      throw new Error("Missing alignment records");
    }

    const marvelShare =
      Number(marvel.within_publisher_share) * 100;

    const dcShare =
      Number(dc.within_publisher_share) * 100;

    const largerPublisher =
      marvel.publisher_total > dc.publisher_total
        ? "Marvel"
        : marvel.publisher_total < dc.publisher_total
          ? "DC"
          : "Neither";

    const largerText = largerPublisher === "Neither"
      ? "Both publishers have equal recorded totals."
      : `${largerPublisher} has more recorded ` +
        `character entries in this dataset.`;

    element.textContent =
      " " +
      largerText + " " +
      `Good-aligned characters make up ` +
      `${marvelShare.toFixed(1)}% of Marvel's ` +
      `entries and ${dcShare.toFixed(1)}% ` +
      `of DC's entries.`;

  } catch (error) {
    console.error(error);

    element.textContent =
      "Unable to calculate mosaic insights.";
  }
}

showMosaicInsight();

// Chart 11: Appearance Ridgeline
renderChart(
  "chart-ridgeline",
  "charts/appearance_ridgeline.json"
);

async function showRidgelineInsight() {
  const element = document.getElementById(
    "ridgeline-insight"
  );

  if (!element) return;

  try {
    const response = await fetch(
      "data/appearance_ridgeline_summary.json"
    );

    if (!response.ok) {
      throw new Error("Ridgeline summary unavailable");
    }

    const data = await response.json();

    const summaries = [];

    for (const publisher of ["Marvel", "DC"]) {

      const groups = data.filter(
        row => row.publisher === publisher
      );

      const total = groups.reduce(
        (sum, row) => sum + row.records,
        0
      );

      const oneAppearance = groups.reduce(
        (sum, row) => sum + row.one_appearance,
        0
      );

      if (total === 0) continue;

      const percentage = (
        oneAppearance / total * 100
      ).toFixed(1);

      summaries.push(
        `${percentage}% of ${publisher}'s ` +
        `included characters have only ` +
        `one recorded appearance`
      );
    }

    element.textContent = summaries.length
      ? " " + summaries.join(
          ", while "
        ) + "."
      : "No appearance data available.";

  } catch (error) {
    console.error(error);

    element.textContent =
      "Unable to calculate ridgeline insights.";
  }
}

showRidgelineInsight();


// Hero metrics are calculated from the same JSON used by the charts.
async function populateHeroMetrics() {
  try {
    const paths = [
      "data/debuts_by_decade.json",
      "data/publisher_countries.json"
    ];
    const responses = await Promise.all(paths.map(path => fetch(path)));
    if (!responses.every(response => response.ok)) return;
    const [debutRows, countryRows] = await Promise.all(
      responses.map(response => response.json())
    );
    const characterTotal = debutRows.reduce(
      (sum, row) => sum + Number(row.characters || 0), 0
    );
    const decades = new Set(debutRows.map(row => row.decade)).size;
    const countries = countryRows.filter(row => Number(row.publishers) > 0).length;
    document.getElementById("metric-characters").textContent = 
      characterTotal.toLocaleString("en-MY");
    document.getElementById("metric-decades").textContent = decades;
    document.getElementById("metric-countries").textContent = countries;
  } catch (error) {
    // Precomputed text in the HTML remains visible if data cannot load.
    console.warn("Dashboard summary could not be refreshed", error);
  }
}

populateHeroMetrics();
