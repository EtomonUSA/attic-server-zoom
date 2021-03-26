import {
    ApplicationContextBase
} from '@znetstar/attic-server/lib/ApplicationContext';
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

interface IIdentityEntityModel{
    externalId: string;
    otherFields?: any;
}

type IIdentityEntity = IIdentityEntityModel&IIdentityEntityBase&IIdentity;

export async function getZoomIdentityEntity(accessToken: IAccessToken): Promise<IIdentityEntity> {
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
        email: body.email,
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


export async function init(ctx: ApplicationContextBase) {
    ctx.on(`Client.getIdentityEntity.zoom.provider`, getZoomIdentityEntity);
}
