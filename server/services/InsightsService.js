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

  static generateCareerCoaching(logs, cycleInfo, avgEnergy, avgProductivity) {
    const coaching = {
      optimalWorkTimes: [],
      careerPhases: {},
      productivityPatterns: [],
      recommendations: []
    };

    if (!cycleInfo || !cycleInfo.isConfigured || logs.length < 7) {
      return coaching;
    }

    // Analyze productivity by cycle phase
    const phaseProductivity = {};
    const phaseEnergy = {};

    logs.forEach(log => {
      // Calculate which cycle phase this log falls into
      const logDate = new Date(log.date);
      const cycleStart = new Date(cycleInfo.lastPeriodStartDate);
      const daysSinceCycleStart = Math.floor((logDate - cycleStart) / (1000 * 60 * 60 * 24)) % cycleInfo.cycleLength;

      let phase;
      if (daysSinceCycleStart < 5) {
        phase = 'menstrual';
      } else if (daysSinceCycleStart < 14) {
        phase = 'follicular';
      } else if (daysSinceCycleStart < 16) {
        phase = 'ovulation';
      } else {
        phase = 'luteal';
      }

      if (!phaseProductivity[phase]) {
        phaseProductivity[phase] = [];
        phaseEnergy[phase] = [];
      }
      phaseProductivity[phase].push(log.productivityRating);
      phaseEnergy[phase].push(log.energyLevel);
    });

    // Calculate averages for each phase
    Object.keys(phaseProductivity).forEach(phase => {
      const prodArray = phaseProductivity[phase];
      const energyArray = phaseEnergy[phase];
      
      if (prodArray.length > 0 && energyArray.length > 0) {
        coaching.careerPhases[phase] = {
          avgProductivity: parseFloat((prodArray.reduce((a, b) => a + b, 0) / prodArray.length).toFixed(1)),
          avgEnergy: parseFloat((energyArray.reduce((a, b) => a + b, 0) / energyArray.length).toFixed(1)),
          description: this.getPhaseDescription(phase),
          optimalActivities: this.getOptimalActivities(phase, 
            prodArray.reduce((a, b) => a + b, 0) / prodArray.length,
            energyArray.reduce((a, b) => a + b, 0) / energyArray.length)
        };
      }
    });

    // Generate work timing recommendations
    const bestPhase = Object.entries(coaching.careerPhases)
      .sort(([,a], [,b]) => b.avgProductivity - a.avgProductivity)[0];

    if (bestPhase) {
      coaching.optimalWorkTimes.push({
        phase: bestPhase[0],
        activity: 'High-stakes presentations',
        reasoning: `Your productivity peaks during ${bestPhase[0]} phase`
      });
    }

    const highEnergyPhase = Object.entries(coaching.careerPhases)
      .sort(([,a], [,b]) => b.avgEnergy - a.avgEnergy)[0];

    if (highEnergyPhase) {
      coaching.optimalWorkTimes.push({
        phase: highEnergyPhase[0],
        activity: 'Networking events',
        reasoning: `Maximum energy during ${highEnergyPhase[0]} phase`
      });
    }

    // Generate productivity patterns
    if (avgProductivity >= 4) {
      coaching.productivityPatterns.push('🌟 High performer! Schedule important deadlines during your peak phases.');
    } else if (avgProductivity >= 3) {
      coaching.productivityPatterns.push('📈 Steady performer. Focus on consistent routines and energy management.');
    } else {
      coaching.productivityPatterns.push('💪 Growth opportunity. Use cycle awareness to optimize your schedule.');
    }

    // Generate career recommendations
    coaching.recommendations = this.generateCareerRecommendations(coaching.careerPhases, avgProductivity, avgEnergy);

    return coaching;
  }

  static getPhaseDescription(phase) {
    const descriptions = {
      menstrual: 'Rest and recovery phase',
      follicular: 'Rising energy and creativity',
      ovulation: 'Peak energy and social confidence',
      luteal: 'Introspective and detail-oriented'
    };
    return descriptions[phase] || phase;
  }

  static getOptimalActivities(phase, productivity, energy) {
    const activities = {
      menstrual: ['Strategic planning', 'Administrative tasks', 'Team coordination'],
      follicular: ['New project starts', 'Creative brainstorming', 'Learning sessions'],
      ovulation: ['Client presentations', 'Networking events', 'Leadership meetings'],
      luteal: ['Detailed analysis', 'Quality assurance', 'Project completion']
    };

    if (productivity >= 4 && energy >= 4) {
      return activities[phase] || [];
    } else if (productivity >= 3 || energy >= 3) {
      return activities[phase]?.slice(0, 2) || [];
    } else {
      return ['Light administrative work', 'Planning and organization'];
    }
  }

  static generateCareerRecommendations(careerPhases, avgProductivity, avgEnergy) {
    const recommendations = [];

    // Find best performing phase
    const bestPhase = Object.entries(careerPhases)
      .sort(([,a], [,b]) => b.avgProductivity - a.avgProductivity)[0];

    if (bestPhase) {
      const [phase, data] = bestPhase;
      recommendations.push(`🎯 Schedule important presentations during your ${phase} phase when productivity averages ${data.avgProductivity}/5.`);
    }

    // Energy-based career advice
    if (avgEnergy >= 4) {
      recommendations.push('⚡ High energy levels! Consider leadership roles or high-visibility projects.');
    } else if (avgEnergy >= 3) {
      recommendations.push('🔋 Good energy foundation. Focus on roles with flexible pacing.');
    } else {
      recommendations.push('💪 Build energy through work-life balance. Consider roles with autonomy.');
    }

    // Productivity-based career advice
    if (avgProductivity >= 4) {
      recommendations.push('📊 Peak performer! Leverage your cycle awareness for career advancement.');
    } else if (avgProductivity >= 3) {
      recommendations.push('📈 Steady contributor. Use cycle tracking to optimize work patterns.');
    } else {
      recommendations.push('🌱 Growth mindset. Your data shows opportunities for optimization.');
    }

    // Phase-specific advice
    if (careerPhases.ovulation && careerPhases.ovulation.avgEnergy >= 4) {
      recommendations.push('🌟 Your ovulation phase shows peak energy - perfect for client-facing work!');
    }

    if (careerPhases.luteal && careerPhases.luteal.avgProductivity >= 4) {
      recommendations.push('🧠 Strong luteal phase productivity - ideal for detailed analytical work.');
    }

    return recommendations.slice(0, 4);
  }
}

module.exports = InsightsService;
