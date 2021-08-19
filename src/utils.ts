const randomString = () => (Math.random() + 1).toString(36).split('.')[1];

export const rando = () => [randomString(), randomString(), randomString()].join('');
