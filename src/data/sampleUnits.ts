export type Activity = {
    id: number;
    type: 'h5p' | 'wordwall';
    url: string;
};

export type Unit = {
    id: number;
    title: string;
    videoUrl: string;
    activities: Activity[];
};

export const sampleUnits: Unit[] = [
    {
        id: 1,
        title: "Unit 1: Grocery Vocabulary",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        activities: [
            { id: 1, type: "h5p", url: "https://h5p.org/h5p/embed/27611" },
            { id: 2, type: "wordwall", url: "https://wordwall.net/embed/example" },
        ],
    }
];