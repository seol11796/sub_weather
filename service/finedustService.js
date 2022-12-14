const api_config = require("../config/finedustApiConfig.json");
const stationNumbering = require("../config/finedustStationNumber.json");
const request = require("request");
const xml2js = require("xml-js");

const base_url = api_config.base_url;
const authKey = api_config.authKey;

// *****************************
// direct return functions below

async function getFinedustPageResolve(stationName) {
  requesturl = finedustRequireURLResolver(authKey, stationName);
  res_xml = await getXml(requesturl);

  var res_json = JSON.parse(
    xml2js.xml2json(res_xml, { compact: true, spaces: 4 })
  );

  var ret = new Object();

  ret.stationName = stationName;
  ret.PMq = res_json["airPolutionInfo"]["row"]["PMq"]["_text"];
  ret.checkDate = res_json["airPolutionInfo"]["row"]["CHECKDATE"];

  var pmq = ret.PMq["_text"] * 1;
  if (pmq < 15) ret.dust_state = "좋음";
  else if (pmq < 35) ret.dust_state = "보통";
  else ret.dust_state = "나쁨";

  return ret;
}

async function getAll() {
  var requesturl = finedustAllURLResolver(authKey);
  var res_xml = await getXml(requesturl);
  return JSON.parse(xml2js.xml2json(res_xml, { compact: true, spaces: 4 }));
}

async function getStation(stationName) {
  var requesturl = finedustRequireURLResolver(authKey, stationName);
  var res_xml = await getXml(requesturl);

  return JSON.parse(xml2js.xml2json(res_xml, { compact: true, spaces: 4 }));
}

async function getValue(stationName) {
  var requesturl = finedustRequireURLResolver(authKey, stationName);
  var res_xml = await getXml(requesturl);

  res_json = JSON.parse(xml2js.xml2json(res_xml, { compact: true, spaces: 4 }));

  var ret = new Object();

  ret.PMq = res_json["airPolutionInfo"]["row"]["PMq"]["_text"];
  var pmq = ret.PMq["_text"] * 1;
  if (pmq < 15) ret.dust_state = "좋음";
  else if (pmq < 35) ret.dust_state = "보통";
  else ret.dust_state = "나쁨";

  return ret;
}

// ***********************
// utility functions below

function getXml(url) {
  return new Promise(function (resolve, reject) {
    request(url, function (err, res, body) {
      if (!err && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(err);
      }
    });
  });
}

function getStationNumber(stationName) {
  for (var i = 1; i < 9; i++) {
    var checkStation =
      stationNumbering[i.toString()].hasOwnProperty(stationName);
    if (checkStation) {
      return stationNumbering[i.toString()][stationName];
    }
  }
  return -1;
}

function finedustRequireURLResolver(key, stationName) {
  start_station = getStationNumber(stationName);
  end_station = start_station;

  return base_url + start_station + "/" + end_station;
}

function finedustAllURLResolver(authKey) {
  return base_url + "1/1000";
}

module.exports = {
  getFinedustPageResolve,
  getAll,
  getStation,
  getValue,
};
