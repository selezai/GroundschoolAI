"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockUserProfile = exports.mockRecommendations = exports.mockTopicProgress = exports.mockQuestions = exports.mockStudyMaterials = void 0;
exports.mockStudyMaterials = [
    {
        id: '1',
        title: 'Aircraft Systems Overview',
        description: 'Learn about the fundamental systems that make up an aircraft',
        type: 'chapter',
        content: {
            sections: [
                'Introduction to Aircraft Systems',
                'Power Plant Systems',
                'Hydraulic Systems',
                'Electrical Systems',
                'Landing Gear',
            ]
        },
        estimatedTime: 45,
        prerequisites: [],
    },
    {
        id: '2',
        title: 'Navigation Fundamentals',
        description: 'Understanding basic navigation concepts and instruments',
        type: 'chapter',
        content: {
            sections: [
                'Basic Navigation Concepts',
                'Navigation Instruments',
                'Flight Planning',
                'GPS and Modern Navigation',
            ]
        },
        estimatedTime: 60,
        prerequisites: ['1'],
    },
    {
        id: '3',
        title: 'Weather Patterns',
        description: 'Learn about weather patterns and their impact on flight',
        type: 'chapter',
        content: {
            sections: [
                'Weather Basics',
                'Cloud Types',
                'Weather Systems',
                'Weather Reports',
            ]
        },
        estimatedTime: 30,
        prerequisites: [],
    },
];
exports.mockQuestions = [
    {
        id: 'q1',
        text: 'What is the primary purpose of an aircraft\'s hydraulic system?',
        type: 'multiple_choice',
        options: [
            'To provide entertainment for passengers',
            'To power flight control surfaces and landing gear',
            'To control cabin temperature',
            'To generate electricity',
        ],
        correctAnswer: 'To power flight control surfaces and landing gear',
        explanation: 'The hydraulic system is crucial for operating flight control surfaces and landing gear, providing the necessary force for these heavy mechanical operations.',
    },
    {
        id: 'q2',
        text: 'True or False: GPS is the only navigation system used in modern aviation.',
        type: 'true_false',
        correctAnswer: 'false',
        explanation: 'While GPS is important, modern aviation uses multiple navigation systems including VOR, ILS, and inertial navigation systems for redundancy and accuracy.',
    },
];
exports.mockTopicProgress = [
    {
        id: '1',
        title: 'Aircraft Systems',
        progress: 0.75,
        lastStudied: new Date('2023-12-01'),
        mastery: 'intermediate',
    },
    {
        id: '2',
        title: 'Navigation',
        progress: 0.45,
        lastStudied: new Date('2023-11-30'),
        mastery: 'basic',
    },
    {
        id: '3',
        title: 'Weather',
        progress: 0.90,
        lastStudied: new Date('2023-11-29'),
        mastery: 'advanced',
    },
];
exports.mockRecommendations = [
    {
        materialId: '2',
        title: 'Navigation Fundamentals',
        reason: 'Your navigation quiz scores indicate room for improvement',
        priority: 'high',
    },
    {
        materialId: '1',
        title: 'Aircraft Systems Review',
        reason: 'It\'s been 2 weeks since your last review',
        priority: 'medium',
    },
];
exports.mockUserProfile = {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    preferences: {
        notifications: true,
        studyReminders: true,
        preferredStudyTime: ['morning', 'evening'],
    },
};
