import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

_client = OpenAI(api_key=os.environ["OPEN_AI_API_KEY"])
_MODEL = os.getenv("RESUME_PARSER_MODEL","gpt-4o-mini")

def complete_resume_json(*,system_prompt:str,resume_text:str)-> dict:
    """
    Ask the model for a JSON object that matches ParsedResumeData.
    response_format json_object stops markdown fences around the JSON.
    """
    completion = _client.chat.completions.create(
        model=_MODEL,
        response_format={"type":"json_object"},
        temperature=0,
        messages=[
            {"role":"system",
            "content":system_prompt
             },
            {
                "role":"user",
                "content": f"Resume text: \n\n{resume_text}",
            },
        ]
    )

    content = completion.choices[0].message.content
    if not content:
        raise ValueError("LLm returned empty resume JSON")

    data = json.loads(content)
    if not isinstance(data,dict):
        raise ValueError("LLM JSON must be an object")

    return data