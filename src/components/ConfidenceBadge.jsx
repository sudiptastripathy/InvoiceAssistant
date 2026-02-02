export default function ConfidenceBadge({ confidence }) {
  // Normalize confidence to 0-1 range (handle both 0-1 and 0-100 formats)
  const normalizedConfidence = confidence > 1 ? confidence / 100 : confidence;
  
  const getColor = (score) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 0.6) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getLabel = (score) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  const percentage = Math.round(normalizedConfidence * 100);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getColor(normalizedConfidence)}`}>
      {getLabel(normalizedConfidence)} ({percentage}%)
    </span>
  );
}
