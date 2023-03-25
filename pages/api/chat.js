// Make sure to add OPENAI_API_KEY as a secret

import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const fs = require('fs');
const yaml = require('js-yaml');

const file = fs.readFileSync('./config.yaml', 'utf8');
const config = yaml.load(file);

const Database = require("@replit/database")
const db = new Database()
const claimsDBKey = "claims"

export default async function(req, res) {
  if (req.body == null) {
    res.status(200).json({ result: config.assistantIntroMessage})
    return
  }

  const message_payload = [{ "role": "system", "content": config.systemPrompt}].concat(req.body.messages)
  // console.log(message_payload)
  const completion = await openai.createChatCompletion({
    //model: "gpt-4", // 3 cents/thousand tokens
    model: "gpt-3.5-turbo", // .2 cents/thousand tokens
    messages: message_payload
  });
  const openai_response = completion.data.choices[0].message.content.trim()
  // const openai_response = "DUMMY RESPONSE"

  if (openai_response.includes('IAMDONE')) {
    console.log("Received response including claim details: " + openai_response);
    if (parseTable(openai_response)) {
      console.log("Response parsed successfully");
      res.status(201).json({ result: config.thankYouMessage})
    } else {
      console.log("Response failed to be parsed as table");
      res.status(500)
    }
  } else {
    res.status(200).json({ result: openai_response})
  }
}

function storeClaim(claim_dict) {
  db.get(claimsDBKey).then(existing_values => {
    if (existing_values == null) {
      db.set(claimsDBKey, [claim_dict]).then(() => {
        console.log("initial claim stored in DB");
      });
    } else {
      db.set(claimsDBKey, existing_values.concat(claim_dict)).then(() => {
        console.log("claim stored in DB");
      });
    }
  });
}

function parseTable(inputString, claimsDataFile) {
  // Split the input string on newlines
  let lines = inputString.split('\n');

  // Filter out any lines that do not contain exactly three '|' characters
  lines = lines.filter(line => line.split('|').length - 1 === 3);

  if (lines.length <= 2) {
    return false;
  }

  // Filter out the first two (header) lines
  let rows = lines.slice(2);

  // Extract the first and second values from each row
  let data = {};
  for (let row of rows) {
    let values = row.split('|').slice(1, -1);
    let key = values[0].trim();
    let value = values[1].trim();
    data[key] = value;
  }

  storeClaim(data);
  return true;
}
