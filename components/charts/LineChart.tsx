import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Path, Circle, Line, Text as SvgText } from 'react-native-svg';

type LineData = { label: string; value: number };
type Props = {
  data?: LineData[];
  width?: number;
  height?: number;
  color?: string;
};

export default function LineChart({
  data = [],
  width = 320,
  height = 180,
  color = '#1A1A1A', // default charcoal black — was purple
}: Props) {
  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const pL = 44, pB = 30, pT = 10;
  const cW = width - pL;
  const cH = height - pB - pT;
  const max = Math.max(...data.map((d) => d.value), 1);

  // Map each data point to (x, y) pixel coordinates
  // x spreads evenly across cW
  // y is inverted: high value = low y (SVG 0,0 is top-left)
  const points = data.map((d, i) => ({
    x: pL + (i / Math.max(data.length - 1, 1)) * cW,
    y: pT + cH - (d.value / max) * cH,
    label: d.label,
  }));

  // Polyline needs a string of "x,y x,y x,y" pairs
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Area fill path: line points + bottom-right + bottom-left corners
  // This creates a closed shape for the shaded area under the line
  const areaPath = [
    `M ${points[0].x} ${points[0].y}`,          // start at first point
    ...points.slice(1).map((p) => `L ${p.x} ${p.y}`), // line to each point
    `L ${points[points.length - 1].x} ${pT + cH}`, // down to bottom-right
    `L ${pL} ${pT + cH}`,                          // across to bottom-left
    'Z',                                            // close path
  ].join(' ');

  // Show x-labels every N points so they don't overlap
  // ceil(length/5) means we show max ~5 labels regardless of data size
  const labelEvery = Math.ceil(data.length / 5);

  // Y gridlines at 25/50/75/100%
  const yTicks = [0.25, 0.5, 0.75, 1.0];

  return (
    <Svg width={width} height={height}>

      {/* Y-axis gridlines + labels */}
      {yTicks.map((t, i) => {
        const y = pT + cH - t * cH;
        return (
          <React.Fragment key={i}>
            <Line
              x1={pL} y1={y}
              x2={width} y2={y}
              stroke="#F0F0F0"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            <SvgText
              x={pL - 6} y={y + 4}
              fontSize={8} fill="#bbb"
              textAnchor="end"
            >
              {(max * t).toFixed(0)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* X-axis baseline */}
      <Line
        x1={pL} y1={height - pB}
        x2={width} y2={height - pB}
        stroke="#E0E0E0" strokeWidth={0.5}
      />

      {/* Shaded area under the line — uses opacity for subtlety */}
      <Path
        d={areaPath}
        fill={color}
        fillOpacity={0.06} // very subtle fill — 6% opacity
      />

      {/* The actual line */}
      <Polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round" // smooth corners at data points
        strokeLinecap="round"
      />

      {/* Data point dots + x-axis labels */}
      {points.map((p, i) => (
        <React.Fragment key={i}>
          {/* White ring + colored dot for each data point */}
          <Circle cx={p.x} cy={p.y} r={4} fill="#fff" />
          <Circle cx={p.x} cy={p.y} r={2.5} fill={color} />

          {/* X label — only every N points to avoid overlap */}
          {i % labelEvery === 0 && (
            <SvgText
              x={p.x} y={height - 10}
              fontSize={8} fill="#999"
              textAnchor="middle"
            >
              {p.label}
            </SvgText>
          )}
        </React.Fragment>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: { height: 180, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#bbb' },
});