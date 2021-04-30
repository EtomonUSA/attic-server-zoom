import { promises as fs } from 'fs';
import {
    IIdentityEntity as
        IIdentityEntityBase
} from "@znetstar/attic-common/lib/IIdentity";

import {
    IAccessToken
} from "@znetstar/attic-common/lib/IAccessToken";

import { GenericError } from '@znetstar/attic-common/lib/Error/GenericError'
import fetch from "node-fetch";
import {IError} from "@znetstar/attic-common/lib/Error/IError";
import {IIdentity} from "@znetstar/attic-common";
import {IApplicationContext, IPlugin} from "@znetstar/attic-common/lib/Server";
import * as _ from 'lodash';

interface IIdentityEntityModel{
    externalId: string;
    otherFields?: any;
}

type IIdentityEntity = IIdentityEntityModel&IIdentityEntityBase&IIdentity;


export class AtticServerZoom implements IPlugin {
    constructor(public applicationContext: IApplicationContext) {

    }

    public async getZoomIdentity(accessToken: IAccessToken): Promise<IIdentityEntity> {
        let resp = await fetch(`https://api.zoom.us/v2/users/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken.token}`
            }
        });



        let body:  any;
        let e2: any;
        try { body = await resp.json(); }
        catch (err) { e2 = err; }

        if (resp.status !== 200) {
            throw new GenericError(`Could not locate Zoom identity`, 2001, 403, (
                body || e2
            ) as any as IError);
        }


        let fields: IIdentityEntity = {
            firstName: body.first_name,
            lastName: body.last_name,
            email: `${body.id}.zoom@${_.get(this, 'applicationContext.config.emailHostname') || process.env.EMAIL_HOSTNAME}`,
            clientName: accessToken.clientName,
            phone: body.phone_number,
            otherFields: body,
            source: {
                href: `https://api.zoom.us/v2/users/${body.id}`
            },
            type: 'IdentityEntity',
            client: accessToken.client,
            user: null,
            externalId: body.id,
            id: null,
            _id: null
        };

        return fields;
    }


    public async init(): Promise<void> {
        this.applicationContext.registerHook<IIdentityEntity>(`Client.getIdentityEntity.zoom.provider`, this.getZoomIdentity);
    }

    public get name(): string {
        return JSON.parse((require('fs').readFileSync(require('path').join(__dirname, '..', 'package.json'), 'utf8'))).name;
    }
}

export default AtticServerZoom;