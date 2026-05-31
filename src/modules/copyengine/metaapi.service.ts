import MetaApi from 'metaapi.cloud-sdk';
import { prisma } from '../../config/database';
import { encrypt } from '../../config/encryption';

const token = process.env.METAAPI_TOKEN!;
export const metaApi = new MetaApi(token);

export class MetaApiService {
  static async provisionCloudTerminal(userId: string, login: string, pass: string, server: string) {
    const encryptedPassword = encrypt(pass);

    const account = await metaApi.metatraderAccountApi.createAccount({
      name: `PESAMATRIX_${login}`,
      type: 'cloud-g2',
      login: login,
      password: pass,
      server: server,
      platform: 'mt5',
      magic: 882026
    });

    await prisma.mt5Account.create({
      data: {
        userId,
        login,
        password: encryptedPassword,
        server,
        metaId: account.id,
        accountType: 'SLAVE'
      }
    });

    return account.id;
  }
}
