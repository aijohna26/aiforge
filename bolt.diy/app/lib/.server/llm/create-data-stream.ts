export function createDataStream({
  execute,
  onError,
}: {
  execute: (dataStream: DataStreamWriter) => Promise<void>;
  onError?: (error: any) => string;
}) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const safeWrite = (chunk: string, context: string) => {
    // Validate chunk format before writing
    if (!chunk.match(/^[0-9a-z]:/)) {
      console.error(`[createDataStream] Invalid chunk format in ${context}:`, chunk.substring(0, 100));
      return;
    }

    writer.write(chunk).catch((e) => {
      // Ignore write errors (e.g. stream closed) to prevent server crash
      // console.error(`[createDataStream] Write error in ${context}:`, e);
    });
  };

  const dataStreamWriter: DataStreamWriter = {
    write: (data: any) => {
      safeWrite(data, 'write');
    },
    merge: async (stream: any) => {
      await dataStreamWriter.mergeIntoDataStream(stream);
    },
    writeData: (data: any) => {
      safeWrite(`2:${JSON.stringify([data])}\n`, 'writeData');
    },
    writeMessageAnnotation: (annotation: any) => {
      safeWrite(`8:${JSON.stringify([annotation])}\n`, 'writeMessageAnnotation');
    },
    mergeIntoDataStream: async (stream: any, options?: { onPart?: (part: any) => void }) => {
      if (stream.fullStream) {
        let partCount = 0;
        for await (const part of stream.fullStream) {
          partCount++;

          if (options?.onPart) {
            try {
              options.onPart(part);
            } catch (e) {
              console.error('Error in onPart callback:', e);
            }
          }

          // AI SDK 6.0: Handle text-delta parts
          if (part.type === 'text-delta') {
            // In AI SDK 6.0, text is in part.text, not part.textDelta
            const text = part.text || part.textDelta || '';
            safeWrite(`0:${JSON.stringify(text)}\n`, 'text-delta');
          }
          // AI SDK 6.0: Also handle 'content-delta' type (new in v6)
          else if (part.type === 'content-delta' && part.delta?.type === 'text-delta') {
            const text = part.delta.textDelta || '';
            safeWrite(`0:${JSON.stringify(text)}\n`, 'content-delta');
          } else if (part.type === 'code-delta') {
            // Handle code delta if applicable (custom?)
          } else if (part.type === 'tool-call') {
            /*
             * Protocol 9: Tool Call
             * { toolCallId: string, toolName: string, args: any }
             */
            const toolCall = {
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              args: part.args,
            };
            safeWrite(`9:${JSON.stringify(toolCall)}\n`, 'tool-call');
          } else if (part.type === 'tool-result') {
            /*
             * Protocol a: Tool Result
             * { toolCallId: string, result: any }
             */
            const toolResult = {
              toolCallId: part.toolCallId,
              result: part.result,
            };
            safeWrite(`a:${JSON.stringify(toolResult)}\n`, 'tool-result');
          } else if (part.type === 'error') {
            const msg = onError ? onError(part.error) : (part.error as any).message;
            safeWrite(`3:${JSON.stringify(msg || 'Unknown error')}\n`, 'error');
          }
        }
      }
    },
  };

  (async () => {
    try {
      await execute(dataStreamWriter);
    } catch (error) {
      const msg = onError ? onError(error) : (error as any)?.message || 'Unknown error';
      safeWrite(`3:${JSON.stringify(msg)}\n`, 'catch-error');
    } finally {
      writer.close().catch(() => { });
    }
  })();

  return readable;
}

export interface DataStreamWriter {
  write(data: any): void;
  merge(stream: any): Promise<void>;
  writeData(data: any): void;
  writeMessageAnnotation(annotation: any): void;
  mergeIntoDataStream(stream: any, options?: { onPart?: (part: any) => void }): Promise<void>;
}
