import * as React from 'react'
import Axios, { CancelTokenSource } from 'axios'
import { CreateRequest, CreateResponse } from '../../../backend/inc/interface'

export interface UploadMetadata {
    name: string
    blob: Blob
}

export interface UploaderProps {
    compiler: string
    framework: string
    metadata: UploadMetadata
    onCancel: () => void
    onDone: () => void
}

enum Stage {
    Create,
    Transfer,
    Done,
    Panic
}

interface UploaderStates {
    stage: Stage
    link: string
    progress: number
}

export class Uploader extends React.Component<UploaderProps, UploaderStates> {
    link_input: HTMLInputElement | null = null
    cancel_callback: ((reason: string) => void) | null = null
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
    private async upload(metadata: UploadMetadata) {
        let flow = await this.createFlow(metadata.blob.size)
        let link = `https://localhost/${flow.id}/${metadata.name}`
        this.setState({ stage: Stage.Transfer, link })
        let storage_url = `${flow.flow_storage}/flow/${flow.flow_id}/push?token=${flow.flow_token}`
        await this.uploadFlow(storage_url, metadata.blob)
    }
    private cancel() {
        if (this.cancel_callback !== null) {
            this.cancel_callback('cancel')
            this.cancel_callback = null
        }
        this.cancel_tokens.forEach((token) => {
            token.cancel()
        })
        this.cancel_tokens.clear()
    }
    componentDidMount() {
        new Promise<void>((resolve, reject) => {
            this.cancel_callback = reject
            this.upload(this.props.metadata).then(resolve).catch(reject)
        }).then(() => {
            this.cancel_callback = null
            this.setState({ stage: Stage.Done })
        }).catch((reason) => {
            if (reason !== 'cancel') {
                this.setState({ stage: Stage.Panic })
            }
        })
    }
    componentWillUnmount() {
        this.cancel()
    }
    handleCopy = () => {
        if (this.link_input !== null) {
            this.link_input.focus()
            this.link_input.setSelectionRange(0, this.link_input.value.length)
            document.execCommand('copy')
        }
    }
    handleCancel = () => {
        this.cancel()
        this.props.onCancel()
    }
    render() {
        let x_msg: JSX.Element | null = null
        switch (this.state.stage) {
        case Stage.Create:
            x_msg = (<div className="alert alert-warning mb-2">Initializing...</div>)
            break
        case Stage.Transfer:
            x_msg = (<div className="alert alert-warning mb-2">Transfering... The file can be downloaded now.</div>)
            break
        case Stage.Done:
            x_msg = (<div className="alert alert-success mb-2">Done.</div>)
            break
        case Stage.Panic:
            x_msg = (<div className="alert alert-danger mb-2">Error.</div>)
            break
        }
        return (<div className="col-md-8 col-lg-6">
            {x_msg}
            <div className="input-group mb-2">
                <div className="input-group-prepend">
                    <button className="btn btn-secondary" onClick={this.handleCopy}>Copy Link</button>
                </div>
                <input className="form-control" type="text" readOnly value={this.state.link} ref={(input) => {this.link_input = input}} />
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
