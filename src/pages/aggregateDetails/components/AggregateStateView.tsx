import React, {useEffect} from 'react';
import {
    Card, CardContent, CardHeader, Divider,
    makeStyles,
} from '@material-ui/core';
import {loadAggregate} from '../../../api';
import {updateAggregateState} from '../../../reducer/aggregateDataReducer';
import {useDispatch, useSelector} from 'react-redux';
import {makeRawAggregateTypeSelector} from '../../../selector/eventEngineSchemaSelector';
import {makeAggregateStateSelector} from '../../../selector/aggregateDataSelector';
import JsonTree from '../../aggregates/components/JsonTree';

const useStyles = makeStyles(theme => ({
}));

interface AggregateStateViewProps {
    aggregateType: string;
    aggregateId: string;
}

const AggregateStateView = (props: AggregateStateViewProps) => {

    const classes = useStyles();
    const dispatch = useDispatch();
    const rawAggregateType = useSelector(makeRawAggregateTypeSelector(props.aggregateType));
    const aggregate = useSelector(makeAggregateStateSelector(props.aggregateId));

    useEffect(() => {
        if (rawAggregateType) {
            loadAggregate(rawAggregateType, props.aggregateId).then(aggregateState => {
                dispatch(updateAggregateState({ aggregateId: props.aggregateId, aggregateState }));
            });
        }
    }, [rawAggregateType, props.aggregateId]);

    return (
        <Card>
            <CardHeader title={'Aggregate State'} />
            <Divider />
            <CardContent>
                <JsonTree data={aggregate} />
            </CardContent>
        </Card>
    );
};

export default AggregateStateView;