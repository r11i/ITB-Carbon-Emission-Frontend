"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface EmissionChartProps {
  location: string;
}

export default function EmissionChart({ location }: EmissionChartProps) {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Sample data - replace with real data from your API
    const data = [
      { year: "2020", emissions: Math.floor(Math.random() * 5000) + 5000 },
      { year: "2021", emissions: Math.floor(Math.random() * 5000) + 5000 },
      { year: "2022", emissions: Math.floor(Math.random() * 5000) + 5000 },
      { year: "2023", emissions: Math.floor(Math.random() * 5000) + 5000 },
      { year: "2024", emissions: Math.floor(Math.random() * 5000) + 5000 },
    ];

    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();

    // Set dimensions
    const width = chartRef.current.clientWidth;
    const height = chartRef.current.clientHeight;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Create SVG
    const svg = d3.select(chartRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMinYMin meet");

    // Create scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.year))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.emissions) || 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Add bars
    svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d.year) || 0)
      .attr("y", d => y(d.emissions))
      .attr("width", x.bandwidth())
      .attr("height", d => height - margin.bottom - y(d.emissions))
      .attr("fill", "#3B82F6")
      .attr("rx", 4)
      .attr("ry", 4);

    // Add value labels
    svg.selectAll(".bar-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", d => (x(d.year) || 0) + x.bandwidth() / 2)
      .attr("y", d => y(d.emissions) - 5)
      .attr("text-anchor", "middle")
      .text(d => d.emissions.toLocaleString())
      .attr("fill", "#1E3A8A")
      .attr("font-size", "12px")
      .attr("font-weight", "bold");

    // Add chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top)
      .attr("text-anchor", "middle")
      .text(`Carbon Emissions Trend - ${location}`)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#374151");

  }, [location]);

  return <svg ref={chartRef} className="w-full h-full"></svg>;
}