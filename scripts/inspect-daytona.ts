import { Daytona } from '@daytonaio/sdk';

async function inspectDaytona() {
    const daytona = new Daytona();
    console.log('Daytona client keys:', Object.keys(daytona));
    console.log('Daytona client prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(daytona)));
}

inspectDaytona();
