#!/usr/bin/python3

# To run, set env variable OPENAI_API_KEY
# requires: pip3 install pyyaml

import os
import openai
import yaml
import json

claims_data_file = "claims.txt"

openai.api_key = os.getenv("OPENAI_API_KEY")

try:
    from yaml import CLoader as Loader, CDumper as Dumper
except ImportError:
    from yaml import Loader, Dumper

with open('config.yaml', 'r') as f:
    config = yaml.load(f, Loader=Loader)


chat_history = []

def construct_messages(initial_prompt):
    result = [
        {"role": "system", "content": initial_prompt},
    ]
    for history_entry in chat_history:
        result.append({"role": history_entry[0], "content": history_entry[1]})
    return result

def parse_table(input_string):
    # Split the input string on newlines
    lines = input_string.split('\n')

    # Filter out any lines that do not contain exactly three '|' characters
    lines = [line for line in lines if line.count('|') == 3]

    # Filter out the first two (header) lines
    rows = lines[2:]

    if not lines:
        return False

    # Extract the first and second values from each row
    data = {}
    for row in rows:
        values = row.split('|')[1:-1]
        key = values[0].strip()
        value = values[1].strip()
        data[key] = value
    
    output_string = json.dumps(data)

    with open(claims_data_file, mode='a') as file:
        file.write(output_string)
        file.write("\n\n")

    return True
    

# Enter loop to prompt user for input
while True:
    completion = openai.ChatCompletion.create(model="gpt-4", messages=construct_messages(config['initialPrompt']))
    response = completion.choices[0].message.content.strip()

    if 'IAMDONE' in response:
        if parse_table(response):
             print(config['thankYouMessage'])
        else:
             print(config['errorMessage'])
        break

    chat_history.append(('assistant', response))
    print(f"{config['agentName']}> {response}")

    user_input = input("You> ")
    chat_history.append(('user', user_input))
 

