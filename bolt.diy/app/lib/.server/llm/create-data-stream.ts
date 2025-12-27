export function createDataStream({
    execute,
    onError,
}: {
    execute: (dataStream: DataStreamWriter) => Promise<void>;
    onError?: (error: any) => string;
}) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const dataStreamWriter: DataStreamWriter = {
        writeData: (data: any) => {
            writer.write(encoder.encode(`2:${JSON.stringify([data])}\n`));
        },
        writeMessageAnnotation: (annotation: any) => {
            writer.write(encoder.encode(`8:${JSON.stringify([annotation])}\n`));
        },
        mergeIntoDataStream: async (stream: any) => {
            if (stream.fullStream) {
                for await (const part of stream.fullStream) {
                    if (part.type === 'text-delta') {
                        writer.write(encoder.encode(`0:${JSON.stringify(part.textDelta)}\n`));
                    } else if (part.type === 'code-delta') {
                        // Handle code delta if applicable (custom?)
                    } else if (part.type === 'tool-call') {
                        // Protocol 9: Tool Call
                        // { toolCallId: string, toolName: string, args: any }
                        const toolCall = {
                            toolCallId: part.toolCallId,
                            toolName: part.toolName,
                            args: part.args
                        };
                        writer.write(encoder.encode(`9:${JSON.stringify(toolCall)}\n`));
                    } else if (part.type === 'tool-result') {
                        // Protocol a: Tool Result
                        // { toolCallId: string, result: any }
                        const toolResult = {
                            toolCallId: part.toolCallId,
                            result: part.result
                        };
                        writer.write(encoder.encode(`a:${JSON.stringify(toolResult)}\n`));
                    } else if (part.type === 'error') {
                        const msg = onError ? onError(part.error) : (part.error as any).message;
                        writer.write(encoder.encode(`3:${JSON.stringify(msg)}\n`));
                    }
                }
            }
        }
    };

    (async () => {
        try {
            await execute(dataStreamWriter);
        } catch (error) {
            const msg = onError ? onError(error) : (error as any)?.message || 'Unknown error';
            writer.write(encoder.encode(`3:${JSON.stringify(msg)}\n`));
        } finally {
            writer.close();
        }
    })();

    return readable;
}

export interface DataStreamWriter {
    writeData(data: any): void;
    writeMessageAnnotation(annotation: any): void;
    mergeIntoDataStream(stream: any): Promise<void>;
}
