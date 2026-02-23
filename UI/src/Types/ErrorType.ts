export type ErrorResponse = {
    type: string,
    title: string,
    status: number,
    detail: string,
    errors?: Record<string, string[]>,
    instance: string,
    traceId?: string,
    timestamp?: string
}