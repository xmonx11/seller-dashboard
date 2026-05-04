import { View, Text, StyleSheet } from 'react-native';

// StatsCard accepts 3 props:
// title  — small label on top (e.g. "Total Revenue")
// value  — big number in the middle (e.g. "₱1,200.00")
// subtitle — optional small text below (e.g. "Linear regression")
type Props = {
  title: string;
  value: string;
  subtitle?: string; // optional — ? means it can be undefined
};

export default function StatsCard({ title, value, subtitle }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {/* Only renders subtitle if it was passed as a prop */}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',       // white card on F5F5F5 background
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flex: 1,                        // flex:1 makes both cards in a row equal width
    marginHorizontal: 4,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',         // subtle border instead of colored background
    // soft shadow for card elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  title: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',     // uppercase labels look more dashboard-like
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',               // charcoal black — was purple #6366f1
  },
  subtitle: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 4,
  },
});