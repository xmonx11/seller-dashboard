import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

// Props: data array of {label, value}, width, height
type BarData = { label: string; value: number };
type Props = { data?: BarData[]; width?: number; height?: number };

export default function BarChart({ data = [], width = 320, height = 180 }: Props) {
  // Empty state — shown when no data from API yet
  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  // Padding constants — space reserved for axes and labels
  // pL = left padding (for y-axis labels)
  // pB = bottom padding (for x-axis labels)
  // pT = top padding (breathing room)
  const pL = 44, pB = 30, pT = 10;

  // Chart area dimensions — actual drawable space
  const cW = width - pL;          // chart width
  const cH = height - pB - pT;   // chart height

  // max is the tallest bar's value — used to scale all bars proportionally
  // Math.max(...) spreads array into individual args
  // We use 1 as fallback so we never divide by zero
  const max = Math.max(...data.map((d) => d.value), 1);

  // gap = horizontal space per bar (including spacing)
  // bW = actual bar width = 60% of gap (40% is spacing between bars)
  const gap = cW / data.length;
  const bW = gap * 0.55;

  // Y-axis: 4 horizontal gridlines at 25%, 50%, 75%, 100% of max
  const yTicks = [0.25, 0.5, 0.75, 1.0];

  return (
    <Svg width={width} height={height}>

      {/* Y-axis gridlines + labels */}
      {yTicks.map((t, i) => {
        const y = pT + cH - t * cH; // convert percentage to pixel position
        const label = (max * t).toFixed(0); // e.g. "250", "500"
        return (
          <React.Fragment key={i}>
            {/* Dashed horizontal gridline */}
            <Line
              x1={pL} y1={y}
              x2={width} y2={y}
              stroke="#F0F0F0"
              strokeWidth={1}
              strokeDasharray="4,3" // dashed pattern: 4px dash, 3px gap
            />
            {/* Y-axis label — right-aligned before pL */}
            <SvgText
              x={pL - 6}
              y={y + 4}
              fontSize={8}
              fill="#bbb"
              textAnchor="end"
            >
              {label}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* X-axis baseline */}
      <Line
        x1={pL} y1={height - pB}
        x2={width} y2={height - pB}
        stroke="#E0E0E0"
        strokeWidth={0.5}
      />

      {/* Bars + X labels */}
      {data.map((d, i) => {
        // Bar height proportional to value vs max
        const bH = Math.max((d.value / max) * cH, 2); // min 2px so 0 value still shows
        const x = pL + i * gap + (gap - bW) / 2; // center bar within its gap
        const y = pT + cH - bH;                  // top of bar (SVG y goes downward)

        return (
          <React.Fragment key={i}>
            <Rect
              x={x} y={y}
              width={bW} height={bH}
              fill="#1A1A1A"   // charcoal black — was purple
              rx={3}           // rounded top corners
            />
            {/* X-axis label below each bar */}
            <SvgText
              x={x + bW / 2}
              y={height - 10}
              fontSize={8}
              fill="#999"
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#bbb',
  },
});