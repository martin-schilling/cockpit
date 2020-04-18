import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {AggregateEvent, AggregateState, PersistedAggregateState, SystemSchema} from './types';
import {Logger} from '../util/Logger';
import {store} from '../store';
import {config} from '../config';

const schemaUrl = () => store.getState().settings.schemaUrl;
const messageBoxUrl = () => store.getState().settings.messageBoxUrl;
const context = () => store.getState().settings.context;

const configuredAxios = axios.create({
});

configuredAxios.interceptors.request.use((requestConfig: any) => {
    requestConfig.metadata = { startTime: new Date() };
    return requestConfig;
});

configuredAxios.interceptors.response.use(
    (response: any) => {
        response.config.metadata.endTime = new Date();
        response.config.metadata.requestTime = response.config.metadata.endTime - response.config.metadata.startTime;
        return response;
    },
    (error: any) => {
        if (error.response) {
            error.response.config.metadata.endTime = new Date();
            error.response.config.metadata.requestTime =
                error.response.config.metadata.endTime - error.response.config.metadata.startTime;
        }

        return Promise.reject(error);
    },
);

export const sendApiRequest = async (
    requestConfig: AxiosRequestConfig,
) => {
    const finalizedRequestConfig = config.hooks.preRequestHook
        ? await config.hooks.preRequestHook(requestConfig, context())
        : requestConfig;

    try {
        return await configuredAxios(finalizedRequestConfig);
    } catch (error) {
        Logger.error(error);
        throw error;
    }
};

export const getSystemSchema = async (): Promise<SystemSchema> => {
    const response: AxiosResponse = await sendApiRequest({ url: schemaUrl() });
    return response.data as SystemSchema;
};

export const loadAggregatesForType = async (rawAggregateType: string): Promise<PersistedAggregateState[]> => {
    const response: AxiosResponse = await sendApiRequest({
        url: schemaUrl() + `/load-aggregates?aggregateType=${rawAggregateType}&limit=${config.aggregateList.filterLimit}`,
    });

    return response.data as PersistedAggregateState[];
};

export const loadAggregateState = async (rawAggregateType: string, aggregateId: string, version?: number): Promise<AggregateState> => {
    const response: AxiosResponse = await sendApiRequest({
        url: schemaUrl() + '/load-aggregate?aggregateType='
            + rawAggregateType + '&aggregateId=' + aggregateId + (version ? `&version=${version}` : ''),
    });

    return response.data as AggregateState;
};

export const loadAggregateEvents = async (rawAggregateType: string, aggregateId: string): Promise<AggregateEvent[]> => {
    const response: AxiosResponse = await sendApiRequest({
        url: schemaUrl() + '/load-aggregate-events?aggregateType='
            + rawAggregateType + '&aggregateId=' + aggregateId,
    });

    return response.data as AggregateEvent[];
};

export const executeCommand = async (commandName: string, payload: any): Promise<AxiosResponse> => {
    return await sendApiRequest({
        url: messageBoxUrl() + `/${commandName}`,
        method: 'post',
        data: payload,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

const executeQuery = async (queryName: string, payload: any): Promise<AxiosResponse> => {
    return await sendApiRequest({
        url: messageBoxUrl() + `/${queryName}`,
        method: 'post',
        data: payload,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

export const Api = {
    getSystemSchema,
    loadAggregatesForType,
    loadAggregateState,
    loadAggregateEvents,
    executeCommand,
    executeQuery,
};
