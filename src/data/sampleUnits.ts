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
        title: "Unit 1: Our Changing Earth",
        videoUrl: "https://www.youtube.com/embed/kInkncJ1fc",
        activities: [
            { id: 1, type: "h5p", url: "https://h5p.org/h5p/embed/27611" },
            { id: 2, type: "wordwall", url: "https://wordwall.net/embed/e783262c452f445c998fecbb46209b73?themeId=1&templateId=3&fontStackId=0" },
        ],
    }
];