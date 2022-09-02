export type MessageResponse = {
    status: number,
    body: { message: string },
};

export const msg = (status: number, message: string): MessageResponse => ({
    status,
    body: { message }
});
