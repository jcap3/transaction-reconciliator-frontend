import React, { useState, useEffect } from 'react';
import styled from 'styled-components'
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { Container, Row, Col, Form, Card, Table, Button, Modal } from 'react-bootstrap'

function Home() {

    const [file1, setFile1] = useState("");
    const [file2, setFile2] = useState("");
    const [token, setToken] = useState("");
    const [file1Match, setFile1Match] = useState("");
    const [file2Match, setFile2Match] = useState("");
    const [file1Unmatch, setFile1Unmatch] = useState("");
    const [file2Unmatch, setFile2Unmatch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [index, setIndex] = useState(false);
    const [potentialMatchList, setPotentialMatchList] = useState(undefined);

    axiosRetry(axios, {
        retryDelay: (retryCount) => {
            return retryCount * 1000;
        },
        retryCondition: e => {
            return e.response.status === 503
        },
        retries: 5
    });

    function handleClose() {
        setShowModal(false);
    }

    function renderMatchResult(data) {
        setFile1Match(data.body.firstTransactionSet)
        setFile2Match(data.body.secondTransactionSet)
    }

    function getKeys() {
        if (file1Unmatch) {
            let obj = file1Unmatch[0].transaction;
            return Object.keys(obj)
        }
    }

    function getHeader(withPotentialMatches) {
        var keys = getKeys();
        if (keys) {
            return (
                <React.Fragment>
                    <th class="key">#</th>
                    {keys.map((key, index) => {
                        return <th class="key" key={key}>{key.toUpperCase()}</th>
                    })}
                    {withPotentialMatches ? <th class="key">POTENTIAL MATCHES</th> : <></>}
                </React.Fragment>
            )
        }
    }

    const RenderRow = (props) => {
        return (
            <React.Fragment>
                <td>{props.index}</td>
                {props.keys.map((key, index) => {
                    return <td key={props.data.transaction[key]}>{props.data.transaction[key]}</td>
                })}
                <td><Button className='submit' size="sm" variant="danger" onClick={() => {
                    setIndex(props.index);
                    setShowModal(true);
                    setPotentialMatchList(props.data.potentialMatches);
                }}>View</Button></td>
            </React.Fragment>
        )
    }

    const RenderPotentialMatchRow = (props) => {
        return (
            <React.Fragment>
                <td>{props.index}</td>
                {props.keys.map((key, index) => {
                    return <td key={props.data[key]}>{props.data[key]}</td>
                })}
            </React.Fragment>
        )
    }


    function getRowsData(tableData) {
        let keys = getKeys();
        if (tableData) {
            if (tableData[0].transaction) {
                return (
                    tableData.map((row, index) => {
                        return <tr key={index}><RenderRow key={index} data={row} keys={keys} index={index} /></tr>
                    })
                )
            } else {
                return (
                    tableData.map((row, index) => {
                        return <tr key={index}><RenderPotentialMatchRow key={index} data={row} keys={keys} index={index} /></tr>
                    })
                )
            }
        }
    }

    function unmatchedHandler() {
        console.log("Using token: " + token)
        axios({
            method: "get",
            url: "http://localhost:8080/api/transactions/" + token + "/unmatchedTransactionsSummary"
        })
            .then((response) => {
                setFile1Unmatch(response.data.body.firstTransactionSet.unmatchedTransactions)
                setFile2Unmatch(response.data.body.secondTransactionSet.unmatchedTransactions)
            })
    }

    function uploadHandler() {
        console.log(file1);
        console.log(file2);

        const formData = new FormData();
        formData.append('firstTransactionSet', file1);
        formData.append('secondTransactionSet', file2);

        axios({
            method: "post",
            url: "http://localhost:8080/api/transactions/upload",
            data: formData
        })
            .then((response) => {
                setToken(response.data.body.reconciliationToken);
                console.log(response.data.body);
                console.log(response.data.body.reconciliationToken);

                axios({
                    method: "get",
                    url: "http://localhost:8080/api/transactions/" + response.data.body.reconciliationToken + "/matchSummary",
                })
                    .then((response2) => {
                        if (response2) {
                            console.log(response2.data)
                            renderMatchResult(response2.data)
                        }
                    })
            })

    }

    return (
        <Style>
            <Container fluid>
                <Row className='content'>
                    <Col>
                        <Card bg='light' className='round'>
                            <Card.Header className='main-card-header round' />
                            <Card.Body>
                                <Container>
                                    <h2>Select files to compare</h2>
                                    <Form>
                                        <Form.Group controlId="formFile" className="mb-3" onChange={(e) => setFile1(e.target.files[0])}>
                                            <Form.Label>Select file 1</Form.Label>
                                            <Form.Control type="file" />
                                        </Form.Group>

                                        <Form.Group controlId="formFile" className="mb-3" onChange={(e) => setFile2(e.target.files[0])}>
                                            <Form.Label>Select file 2</Form.Label>
                                            <Form.Control type="file" />
                                        </Form.Group>


                                        <Button className='submit' block variant="danger" id="submit" onClick={uploadHandler}>Compare</Button>

                                    </Form>
                                </Container>
                            </Card.Body>
                        </Card>

                        <Card bg='light' className='round'>
                            <Card.Header className='main-card-header round' />
                            <Card.Body>

                                <h2>Comparison results</h2>
                                <Row>
                                    <Col>
                                        <Card bg='light' className='round'>
                                            <Card.Header className='main-card-header round' />
                                            <Card.Body>
                                                <Card.Title>{file1.name}</Card.Title>
                                                <Card.Text>{"Total Records: " + (file1Match.totalUniqueRecords ? file1Match.totalUniqueRecords : "")}</Card.Text>
                                                <Card.Text>{"Matching Records: " + (file1Match.matchedTransactions ? file1Match.matchedTransactions : "")}</Card.Text>
                                                <Card.Text>{"Unmatched Records: " + (file1Match.unmatchedTransactions ? file1Match.unmatchedTransactions : "")}</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col>
                                        <Card bg='light' className='round'>
                                            <Card.Header className='main-card-header round' />
                                            <Card.Body>
                                                <Card.Title>{file2.name}</Card.Title>
                                                <Card.Text>{"Total Records: " + (file2Match.totalUniqueRecords ? file2Match.totalUniqueRecords : "")}</Card.Text>
                                                <Card.Text>{"Matching Records: " + (file2Match.matchedTransactions ? file2Match.matchedTransactions : "")}</Card.Text>
                                                <Card.Text>{"Unmatched Records: " + (file2Match.unmatchedTransactions ? file2Match.unmatchedTransactions : "")}</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                                <Button className='submit' block variant="danger" id="unmatched" onClick={unmatchedHandler}>Unmatched Report</Button>

                            </Card.Body>
                        </Card>

                        <Card bg='light' className='round'>
                            <Card.Header className='main-card-header round' />
                            <Card.Body>

                                <h2>Umatched Report</h2>
                                <Row>
                                    <Col>
                                        <Card bg='light' className='round'>
                                            <Card.Header className='main-card-header round' />
                                            <Card.Body>
                                                <Card.Title>{file1.name}</Card.Title>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            {getHeader(true)}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {getRowsData(file1Unmatch)}
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col>
                                        <Card bg='light' className='round'>
                                            <Card.Header className='main-card-header round' />
                                            <Card.Body>
                                                <Card.Title>{file2.name}</Card.Title>
                                                <Table>
                                                    <thead>
                                                        <tr>
                                                            {getHeader(true)}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {getRowsData(file2Unmatch)}
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                <Modal fullscreen className="modal" show={showModal} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Potential Matches</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Table>
                            <thead>
                                <tr>
                                    {getHeader()}
                                </tr>
                            </thead>
                            <tbody>
                                {getRowsData(potentialMatchList)}
                            </tbody>
                        </Table>
                    </Modal.Body>
                </Modal>
            </Container>
        </Style>
    )

}

export default Home;

const Style = styled.div`
    .content {
        max-width: 1600px;
        margin: 0 auto;
    }
    .header{
        background-size: cover;
        margin-top: 40px;
        height: 200px;
    }
    .main-card-header {
        background-color: rgb(148,48,36);
    }
    .mandatory {
        color: red;
    }
    .round {
        border-radius: 25px;
        margin-bottom: 15px;
    }
    .item {
        margin-top: 15px;
    }

    .some-form {
        margin-top: 35px;
    }
    .plain-header {
        margin-top: 20px;
    }
    .title{ 
        margin-top: -40px;
    }
    .somenote {
        font-style: italic;
    }
    .submit {
        margin-bottom: 20px;
    }
    .key, td {
        font-size: 11px;
    }
    .modal {
        width: auto !important;
    }
    
`;