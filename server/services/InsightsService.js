class InsightsService {
  static analyzeData(logs, cycleInfo = null) {
    if (logs.length === 0) {
      return null;
    }

    // Calculate averages
    const avgEnergyLevel = logs.reduce((sum, log) => sum + log.energyLevel, 0) / logs.length;
    const avgProductivity = logs.reduce((sum, log) => sum + log.productivityRating, 0) / logs.length;

    // Find best energy days
    const maxEnergy = Math.max(...logs.map(log => log.energyLevel));
    const bestEnergyDays = logs
      .filter(log => log.energyLevel === maxEnergy)
      .map(log => new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }))
      .slice(0, 3);

    // Find most productive mood
    const moodProductivity = {};
    logs.forEach(log => {
      if (!moodProductivity[log.mood]) {
        moodProductivity[log.mood] = { count: 0, totalProductivity: 0 };
      }
      moodProductivity[log.mood].count++;
      moodProductivity[log.mood].totalProductivity += log.productivityRating;
    });

    let mostProductiveMood = null;
    let maxAvgProductivity = 0;
    for (const [mood, data] of Object.entries(moodProductivity)) {
      const avg = data.totalProductivity / data.count;
      if (avg > maxAvgProductivity) {
        maxAvgProductivity = avg;
        mostProductiveMood = mood;
      }
    }

    // Symptom frequency
    const symptomFrequency = {};
    logs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
      });
    });

    // Mood frequency
    const moodFrequency = {};
    logs.forEach(log => {
      moodFrequency[log.mood] = (moodFrequency[log.mood] || 0) + 1;
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      logs,
      avgEnergyLevel,
      avgProductivity,
      mostProductiveMood,
      symptomFrequency,
      moodFrequency,
      cycleInfo
    );

    // Generate career coaching insights
    const careerCoaching = this.generateCareerCoaching(logs, cycleInfo, avgEnergyLevel, avgProductivity);

    return {
      totalDaysLogged: logs.length,
      avgEnergyLevel: parseFloat(avgEnergyLevel.toFixed(2)),
      avgProductivity: parseFloat(avgProductivity.toFixed(2)),
      bestEnergyDays,
      mostProductiveMood,
      symptomFrequency,
      moodFrequency,
      recommendations,
      careerCoaching,
      cycleInfo: cycleInfo || null,
      analysisDate: new Date().toISOString()
    };
  }

  static generateRecommendations(logs, avgEnergy, avgProductivity, bestMood, symptoms, moods, cycleInfo) {
    const recommendations = [];

    // Energy-based recommendations
    if (avgEnergy < 2.5) {
      recommendations.push('💪 Your energy levels are consistently low. Consider incorporating more rest days, exercise, or consulting healthcare if symptoms persist.');
    } else if (avgEnergy < 3.5) {
      recommendations.push('⚡ Try to identify patterns in your low-energy days. Consider tracking sleep quality and nutrition to boost energy.');
    } else {
      recommendations.push('✨ Great energy levels! Keep up with whatever activities are working for you.');
    }

    // Productivity-based recommendations
    if (avgProductivity < 2.5) {
      recommendations.push('📌 Your productivity is lower than optimal. Break tasks into smaller chunks and identify your peak productivity hours.');
    } else if (avgProductivity < 3.5) {
      recommendations.push('📈 There\'s room to improve productivity! Notice when you feel most focused and schedule important tasks accordingly.');
    } else {
      recommendations.push('🎯 Excellent productivity! Continue your current routine and share your strategies with others.');
    }

    // Mood-based recommendations
    if (bestMood && bestMood !== 'great' && bestMood !== 'good') {
      recommendations.push(`🧠 Your best productivity comes with "${bestMood}" mood. This might be counterintuitive—explore what drives focus during this state.`);
    } else if (bestMood === 'great') {
      recommendations.push('😄 You\'re most productive when feeling great! Schedule important work for days when you\'re in this mood.');
    }

    // Symptom-based recommendations
    if (Object.keys(symptoms).length > 0) {
      const topSymptom = Object.entries(symptoms).sort((a, b) => b[1] - a[1])[0];
      recommendations.push(`💊 "${topSymptom[0]}" is your most common symptom (${topSymptom[1]} occurrences). Consider lifestyle adjustments or consult a healthcare provider.`);
    }

    // Cycle-based recommendations
    if (cycleInfo && cycleInfo.isConfigured) {
      recommendations.push(`🔄 Your cycle is being tracked! Average cycle length: ${cycleInfo.cycleLength} days. Plan important tasks during your high-energy ovulation phase.`);
    }

    // Pattern-based recommendations
    if (logs.length >= 7) {
      const recentLogs = logs.slice(0, 7);
      const recentAvgEnergy = recentLogs.reduce((sum, log) => sum + log.energyLevel, 0) / recentLogs.length;
      const overallAvgEnergy = logs.reduce((sum, log) => sum + log.energyLevel, 0) / logs.length;
      
      if (recentAvgEnergy > overallAvgEnergy + 0.5) {
        recommendations.push('📊 Recent trend: Your energy has improved! Identify what changed and maintain those habits.');
      } else if (recentAvgEnergy < overallAvgEnergy - 0.5) {
        recommendations.push('⚠️ Recent trend: Your energy has declined. Review recent changes in routine, stress levels, or lifestyle.');
      }
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }
}

module.exports = InsightsService;
