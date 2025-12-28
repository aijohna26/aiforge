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
    merge: (stream: any) => {
      // Fire and forget - don't await
      dataStreamWriter.mergeIntoDataStream(stream);
    },
    writeData: (data: any) => {
      safeWrite(`2:${JSON.stringify([data])}\n`, 'writeData');
    },
    writeMessageAnnotation: (annotation: any) => {
      safeWrite(`8:${JSON.stringify([annotation])}\n`, 'writeMessageAnnotation');
    },
    onError: onError,
    mergeIntoDataStream: async (stream: any, options?: { onPart?: (part: any) => void }) => {
      if (stream.fullStream) {
        for await (const part of stream.fullStream) {
          if (options?.onPart) {
            try {
              options.onPart(part);
            } catch (e) {
              // Ignore errors in callback
            }
          }

          if (part.type === 'text-delta') {
            const text = part.textDelta || (part as any).text || '';
            safeWrite(`0:${JSON.stringify(text)}\n`, 'text-delta');
          } else if (part.type === 'code-delta') {
            // Handle code delta if applicable (custom?)
          } else if (part.type === 'tool-call') {
            const toolCall = {
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              args: part.args,
            };
            safeWrite(`9:${JSON.stringify(toolCall)}\n`, 'tool-call');
          } else if (part.type === 'tool-result') {
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
  merge(stream: any): void;
  writeData(data: any): void;
  writeMessageAnnotation(annotation: any): void;
  mergeIntoDataStream(stream: any, options?: { onPart?: (part: any) => void }): Promise<void>;
  onError: ((error: any) => string) | undefined;
}
