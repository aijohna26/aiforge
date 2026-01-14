import { path } from '~/utils/path';

const normalizePath = (filePath: string) => filePath.replace(/\\/g, '/').replace(/^\.\/+/, '');

const normalizeWorkdir = (workdir: string) => workdir.replace(/\\/g, '/').replace(/\/+$/g, '');

const isWithinWorkdir = (filePath: string, workdir: string) => {
  const normalizedWorkdir = normalizeWorkdir(workdir);
  if (filePath === normalizedWorkdir) {
    return true;
  }

  return filePath.startsWith(`${normalizedWorkdir}/`);
};

export const toWebContainerRelativePath = (filePath: string, workdir: string) => {
  if (!filePath) {
    return filePath;
  }

  const normalized = normalizePath(filePath);

  if (isWithinWorkdir(normalized, workdir)) {
    return path.relative(normalizeWorkdir(workdir), normalized);
  }

  if (normalized.startsWith('/')) {
    return normalized.replace(/^\/+/, '');
  }

  return normalized;
};

export const toWebContainerAbsolutePath = (filePath: string, workdir: string) => {
  if (!filePath) {
    return filePath;
  }

  const normalized = normalizePath(filePath);

  if (isWithinWorkdir(normalized, workdir)) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    return path.join(normalizeWorkdir(workdir), normalized.replace(/^\/+/, ''));
  }

  return path.join(normalizeWorkdir(workdir), normalized);
};
