import * as React from 'react'
import Axios, { CancelTokenSource } from 'axios'
import { CreateRequest, CreateResponse } from '../../../backend/inc/interface'

export interface UploaderProps {
    compiler: string
    framework: string
    file: FileMetadata
    onCancel: () => void
    onDone: () => void
}

enum Stage {
    Create,
    Transfer,
    Done
}

interface UploaderStates {
    stage: Stage
    link: string
    progress: number
}

export interface FileMetadata {
    name: string
    blob: Blob
}

export class Uploader extends React.Component<UploaderProps, UploaderStates> {
    cancel_callback: (() => void) | null = null
    cancel_tokens: Set<CancelTokenSource> = new Set()
    constructor(props: UploaderProps) {
        super(props)
        this.state = {
            stage: Stage.Create,
            link: '',
            progress: 0
        }
    }
    private getCancelToken(): CancelTokenSource {
        let token = Axios.CancelToken.source()
        this.cancel_tokens.add(token)
        return token
    }
    private removeCancelToken(token: CancelTokenSource) {
        this.cancel_tokens.delete(token)
    }
    private async createFlow(size: number): Promise<CreateResponse> {
        let req: CreateRequest = {
            file_size: size
        }
        let res = await Axios.post<CreateResponse>('/api/create', req)
        if (res.status != 200) {
            // TODO
            throw 'TODO'
        }
        return res.data
    }
    private async uploadFlow(storage_url: string, blob: Blob): Promise<void> {
        let cancel_token = this.getCancelToken()
        let res = await Axios.post(storage_url, blob, {
            responseType: 'text',
            onUploadProgress: (evt: ProgressEvent) => {
                this.setState({ progress: evt.loaded * 100 / evt.total })
            },
            cancelToken: cancel_token.token
        })
        this.removeCancelToken(cancel_token)
        if (res.status !== 200) {
            // TODO
            throw 'TODO'
        }
    }
    private async upload(file: FileMetadata) {
        let flow = await this.createFlow(file.blob.size)
        let link = `https://localhost/${flow.id}/${file.name}`
        this.setState({ stage: Stage.Transfer, link })
        let storage_url = `${flow.flow_storage}/flow/${flow.flow_id}/push?token=${flow.flow_token}`
        await this.uploadFlow(storage_url, file.blob)
    }
    private cancel() {
        if (this.cancel_callback !== null) {
            this.cancel_callback()
            this.cancel_callback = null
        }
        this.cancel_tokens.forEach((token) => {
            token.cancel()
        })
        this.cancel_tokens.clear()
    }
    componentDidMount() {
        let file = this.props.file
        new Promise<void>((resolve, reject) => {
            this.cancel_callback = reject
            this.upload(file).then(resolve)
        }).then(() => {
            this.cancel_callback = null
            this.setState({ stage: Stage.Done })
        }).catch(() => {
            // TODO
        })
    }
    componentWillUnmount() {
        this.cancel()
    }
    handleCancel = () => {
        this.cancel()
        this.props.onCancel()
    }
    render() {
        return (<div className="col-md-8 col-lg-6">
            <div className="input-group mb-2">
                <div className="input-group-prepend">
                    <button className="btn btn-secondary">Copy Link</button>
                </div>
                <input className="form-control" type="text" readOnly placeholder="Preparing..." value={this.state.link} />
            </div>
            <div className="progress mb-2">
                <div className="progress-bar" style={{width: `${this.state.progress}%`}} role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}></div>
            </div>
            {this.state.stage === Stage.Done ? (
                <button className="btn btn-success" onClick={this.props.onDone}>Leave</button>
            ) : (
                <button className="btn" onClick={this.handleCancel}>Cancel</button>
            )}
        </div>)
    }
}
