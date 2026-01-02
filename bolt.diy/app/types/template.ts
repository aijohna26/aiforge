export interface Template {
  name: string;
  label: string;
  description: string;
  githubRepo?: string;
  localPath?: string;
  tags?: string[];
  icon?: string;
}
