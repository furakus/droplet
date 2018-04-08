export interface CreateRequest {
    file_size: number
    id?: string
}

export interface CreateResponse {
    id: string
    flow_storage: string
    flow_id: string
    flow_token: string
}

export enum ErrorMessage {
    INVALID_PARAM = 'Invalid Parameter',
    INVALID_ID = 'Invalid ID',
    DUPLICATED_ID = 'Duplicated ID',
    INTERNAL = 'Internal Error'
}
