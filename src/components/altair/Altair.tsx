/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";

const procedureCheckingFunctionDeclaration: FunctionDeclaration = {
	name: "checkProcedureAlignment",
	description: "Based on the video procedure and user's stream input, determine if the user is following the correct order based on a given image and conversation context.",
	parameters: {
		type: SchemaType.OBJECT,
		properties: {
			realityImageDescription: {
				type: SchemaType.STRING,
				description: "A brief description of the current reality image.",
			},
      personNumber: {
        type: SchemaType.NUMBER,
        description: "The number of people in the image.",
      },
		},
		required: ["realityImageDescription", "personNumber"],
	},
};
// const declaration: FunctionDeclaration = {
//   name: "render_altair",
//   description: "Displays an altair graph in json format.",
//   parameters: {
//     type: SchemaType.OBJECT,
//     properties: {
//       json_graph: {
//         type: SchemaType.STRING,
//         description:
//           "JSON STRING representation of the graph to render. Must be a string, not a json object",
//       },
//     },
//     required: ["json_graph"],
//   },
// };

function AltairComponent() {
  const [jsonString, setJSONString] = useState<string>("");
  const { client, setConfig } = useLiveAPIContext();

  
  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        // responseModalities: "audio",
        responseModalities: "text",
        responseMimeType: "application/json",
        // responseSchema: procedureCheckingFunctionDeclaration,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
      },
      // systemInstruction: {
      //   parts: [
      //     {
      //       text: 'You are my helpful assistant. Any time I ask you for a graph call the "render_altair" function I have provided you. Dont ask for additional information just make your best judgement.',
      //     },
      //   ],
      // },
      tools: [
        // there is a free-tier quota for search
        { googleSearch: {} },
        { functionDeclarations: [procedureCheckingFunctionDeclaration] },
      ],
    });
  }, [setConfig]);

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall`, toolCall);
      const fc = toolCall.functionCalls.find(
        (fc) => fc.name === procedureCheckingFunctionDeclaration.name,
      );
      if (fc) {
        const str = (fc.args as any).json_graph;
        console.log(`json_graph:`, str); // Log the json_graph value
        setJSONString(str);
      }
    };

    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);


  // useEffect(() => {
  //   const onToolCall = (toolCall: ToolCall) => {
  //     console.log(`got toolcall`, toolCall);
  //     const fc = toolCall.functionCalls.find(
  //       // (fc) => fc.name === declaration.name,
  //       (fc) => fc.name === procedureCheckingFunctionDeclaration.name,
  //     );
  //     if (fc) {
  //       const str = (fc.args as any).json_graph;
  //       setJSONString(str);
  //     }
  //     // send data for the response of your tool call
  //     // in this case Im just saying it was successful
  //     if (toolCall.functionCalls.length) {
  //       setTimeout(
  //         () =>
  //           client.sendToolResponse({
  //             functionResponses: toolCall.functionCalls.map((fc) => ({
  //               response: { output: { success: true } },
  //               id: fc.id,
  //             })),
  //           }),
  //         200,
  //       );
  //     }
  //   };
  //   client.on("toolcall", onToolCall);
  //   return () => {
  //     client.off("toolcall", onToolCall);
  //   };
  // }, [client]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      console.log(jsonString);
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);

  return <div className="vega-embed" ref={embedRef} />;
}

export const Altair = memo(AltairComponent);
