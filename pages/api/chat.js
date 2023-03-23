// Make sure to add OPENAI_API_KEY as a secret

import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function(req, res) {
  const completion = await openai.createChatCompletion({
    // You need early access to GPT-4, otherwise use "gpt-3.5-turbo"
    // Downgraded to GPT-4 due to high traffic. Sorry for the inconvenience.
    model: "gpt-4",
    messages: [{ "role": "system", "content": "You are a helpful assistant. Start by complimenting the user." }].concat(req.body.messages)

  });
  res.status(200).json({ result: completion.data.choices[0].message })

}