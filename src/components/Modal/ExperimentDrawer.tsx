import * as React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { downFile } from '../../static/function';
import { Drawer, Tabs, Row, Col, Button } from 'antd';
import { MANAGER_IP, DRAWEROPTION } from '../../static/const';
import MonacoEditor from 'react-monaco-editor';
const { TabPane } = Tabs;
import '../../static/style/logDrawer.scss';

interface ExpDrawerProps {
    isVisble: boolean;
    closeExpDrawer: () => void;
    port:string;
}

interface ExpDrawerState {
    experiment: string;
    port: string;
}

class ExperimentDrawer extends React.Component<ExpDrawerProps, ExpDrawerState> {

    public _isCompareMount: boolean;
    constructor(props: ExpDrawerProps) {
        super(props);

        this.state = {
            experiment: '',
            port:this.props.port
        };
    }

    getExperimentContent = () => {
        axios
            .all([
                axios.get(`${MANAGER_IP}/experiment`,{headers:{'upstream': this.state.port}}),
                axios.get(`${MANAGER_IP}/trial-jobs`,{headers:{'upstream': this.state.port}}),
                axios.get(`${MANAGER_IP}/metric-data`,{headers:{'upstream': this.state.port}})
            ])
            .then(axios.spread((res, res1, res2) => {
                if (res.status === 200 && res1.status === 200 && res2.status === 200) {
                    if (res.data.params.searchSpace) {
                        res.data.params.searchSpace = JSON.parse(res.data.params.searchSpace);
                    }
                    let trialMessagesArr = res1.data;
                    const interResultList = res2.data;
                    Object.keys(trialMessagesArr).map(item => {
                        // transform hyperparameters as object to show elegantly
                        trialMessagesArr[item].hyperParameters = JSON.parse(trialMessagesArr[item].hyperParameters);
                        const trialId = trialMessagesArr[item].id;
                        // add intermediate result message
                        trialMessagesArr[item].intermediate = [];
                        Object.keys(interResultList).map(key => {
                            const interId = interResultList[key].trialJobId;
                            if (trialId === interId) {
                                trialMessagesArr[item].intermediate.push(interResultList[key]);
                            }
                        });
                    });
                    const result = {
                        experimentParameters: res.data,
                        trialMessage: trialMessagesArr
                    };
                    if (this._isCompareMount === true) {
                        this.setState(() => ({ experiment: JSON.stringify(result, null, 4) }));
                    }
                }
            }));
    }

    downExperimentParameters = () => {
        const { experiment } = this.state;
        downFile(experiment, 'experiment.json');
    }

    componentDidMount() {
        this._isCompareMount = true;
        this.getExperimentContent();
    }

    componentWillReceiveProps(nextProps: ExpDrawerProps) {
        const { isVisble } = nextProps;
        if (isVisble === true) {
            this.getExperimentContent();
        }
    }

    componentWillUnmount() {
        this._isCompareMount = false;
    }

    render() {
        const { isVisble, closeExpDrawer } = this.props;
        const { experiment } = this.state;
        const heights: number = window.innerHeight - 48;
        return (
            <Row className="logDrawer">
                <Drawer
                    // title="Log Message"
                    placement="right"
                    closable={false}
                    destroyOnClose={true}
                    onClose={closeExpDrawer}
                    visible={isVisble}
                    width="54%"
                    height={heights}
                >
                    <div className="card-container log-tab-body" style={{ height: heights }}>
                        <Tabs type="card" style={{ height: heights + 19 }}>
                            <TabPane tab="Experiment Parameters" key="Experiment">
                                <div className="just-for-log">
                                    <MonacoEditor
                                        width="100%"
                                        height={heights * 0.9}
                                        language="json"
                                        value={experiment}
                                        options={DRAWEROPTION}
                                    />
                                </div>
                                <Row className="buttons">
                                    <Col span={12}  className="download">
                                        <Button
                                            type="primary"
                                            onClick={this.downExperimentParameters}
                                        >
                                            Download
                                        </Button>
                                    </Col>
                                    <Col span={12} className="close">
                                        <Button
                                            type="default"
                                            onClick={closeExpDrawer}
                                        >
                                            Close
                                        </Button>
                                    </Col>
                                </Row>
                            </TabPane>
                        </Tabs>
                    </div>
                </Drawer>
            </Row>
        );
    }
}

// export default ExperimentDrawer;
export default connect<any, any, any>((state,props)=>({port:state.PortReducer}) )(ExperimentDrawer);

