const calcCurrentlyInfected = (reportedCases) => reportedCases * 10;

const calcSevereCurrentlyInfected = (reportedCases) => reportedCases * 50;

const calcInfections = (currentlyInfected, factor) => currentlyInfected * factor;

const calcSevereCases = (infections) => Math.trunc(0.15 * infections);

const calcIcuCare = (infections) => Math.trunc(0.05 * infections);

const calcVentilators = (infections) => Math.trunc(0.02 * infections);

const calcDollarsInFlight = (infections, avgDailyUSD, avgIncomePop, period) => (
  Math.trunc((infections * avgDailyUSD * avgIncomePop) / period));

const calcDays = (periodType, timeToElapse) => {
  switch (periodType) {
    case 'days':
      return timeToElapse;
    case 'weeks':
      return timeToElapse * 7;
    case 'months':
      return timeToElapse * 30;
    default:
      return timeToElapse;
  }
};

 const calcFactor = (periodType, timeToElapse) => {
  switch (periodType) {
    case 'days':
      return 2 ** Math.trunc(timeToElapse / 3);
    case 'weeks':
      return 2 ** Math.trunc((timeToElapse * 7) / 3);
    case 'months':
      return 2 ** Math.trunc((timeToElapse * 30) / 3);
    default:
      return 2 ** Math.trunc(timeToElapse / 3);
  }
};

 const calcHospitalBeds = (totalHospitalBeds, severeCasesByRequestedTime) => {
  const availableBeds = 0.35 * totalHospitalBeds;
  // if ((availableBeds - severeCasesByRequestedTime) >= 0) {
  //   return Math.trunc(availableBeds);
  // }
  return Math.trunc(availableBeds - severeCasesByRequestedTime);
};

const covid19ImpactEstimator = (data) => {
  const currentlyInfected = calcCurrentlyInfected(data.reportedCases);
  const severeCurrentlyInfected = calcSevereCurrentlyInfected(data.reportedCases);
  const days = calcDays(data.periodType, data.timeToElapse);
  const factor = calcFactor(data.periodType, data.timeToElapse);
  const impactInfectionsByRequestedTime = calcInfections(currentlyInfected, factor);
  const impactSCaseRequest = calcSevereCases(impactInfectionsByRequestedTime);
  const severeImpactInfectionsByRequestedTime = calcInfections(severeCurrentlyInfected, factor);
  const severeSCaseRequest = calcSevereCases(severeImpactInfectionsByRequestedTime);

  return {
    data,
    impact: {
      currentlyInfected,
      infectionsByRequestedTime: impactInfectionsByRequestedTime,
      severeCasesByRequestedTime: impactSCaseRequest,
      hospitalBedsByRequestedTime: calcHospitalBeds(data.totalHospitalBeds,
        impactSCaseRequest),
      casesForICUByRequestedTime: calcIcuCare(impactInfectionsByRequestedTime),
      casesForVentilatorsByRequestedTime: calcVentilators(impactInfectionsByRequestedTime),
      dollarsInFlight: calcDollarsInFlight(impactInfectionsByRequestedTime,
        data.region.avgDailyIncomePopulation, data.region.avgDailyIncomeInUSD,
        days)

    },
    severeImpact: {
      currentlyInfected: severeCurrentlyInfected,
      infectionsByRequestedTime: severeImpactInfectionsByRequestedTime,
      severeCasesByRequestedTime: severeSCaseRequest,
      hospitalBedsByRequestedTime: calcHospitalBeds(data.totalHospitalBeds,
        severeSCaseRequest),
      casesForICUByRequestedTime: calcIcuCare(severeImpactInfectionsByRequestedTime),
      casesForVentilatorsByRequestedTime: calcVentilators(severeImpactInfectionsByRequestedTime),
      dollarsInFlight: calcDollarsInFlight(severeImpactInfectionsByRequestedTime,
        data.region.avgDailyIncomePopulation, data.region.avgDailyIncomeInUSD,
        days)


    }
  };
};

module.exports = covid19ImpactEstimator;