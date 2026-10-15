
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
      actions: true,
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

