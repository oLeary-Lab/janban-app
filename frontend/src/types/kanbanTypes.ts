export type Column = {
  columnId: string;
  title: string;
};

export type Issue = {
  _id: string;
  project: string;
  issueCategory: string;
  isBacklog: boolean;
  issueCode: string;
  name: string;
  description: string;
  storyPoints: number;
  assignee: string;
  columnId: string;
  createdAt: Date;
  lastUpdated: Date;
};
