const express  = require("express")
const bodyParser = require("body-parser")
const  xml = require('object-to-xml')
const  fs = require('fs')

const app = express()
const port = process.env.PORT || 1337;

const fileName = 'log.txt'

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

const log = (req,res) => {
    const duration = Date.now() - req.body.start;
    fs.appendFile(fileName,`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms\n`, function (err) {
        if (err) return console.log(err);
    })
}

app.get("/api/v1/on-covid-19/logs", (req,res) => {    
    const logs = fs.readFileSync(fileName);
    res.type("text/plain")
    return res.send(logs)
})


app.use(bodyParser.json({ extended: true }));

app.use("/", (req,res,next) => {
    req.body.start = Date.now()
    next();
})

app.post(['/api/v1/on-covid-19','/api/v1/on-covid-19/json'], (req, res,next) => {
    res.on("finish",() => {
       log(req,res)
    })
    return res.json(covid19ImpactEstimator(req.body));

})

app.post('/api/v1/on-covid-19/xml', (req, res,next) => {
    res.type('application/xml');
    log(req,res)
    return res.send(xml(covid19ImpactEstimator(req.body)))
})


app.use((req,res) => {
    res.status(400)
    log(req,res)
   return res.send("Not found")
})

app.listen(port, () => console.log(`Example app listening at ${port}`))