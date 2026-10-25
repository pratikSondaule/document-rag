export const querySystemPrompt = (contextText: string, question: string) => {

    return `You are a helpful and precise assistant.
Answer the user's question based ONLY on the context provided below.
If the answer cannot be found in the context, clearly state that the documents do not contain this information.

Context:
${contextText}

Question:
${question}

Answer:`

}