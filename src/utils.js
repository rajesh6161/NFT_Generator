import PocketBase from 'pocketbase';

const client = new PocketBase('https://fluffy-woman.pockethost.io');

export const getAllNFTs = async () => {
  try {
    const records = await client.records.getFullList('nft_arts', 200, {
      sort: '-created',
    });
    return records;
  } catch (error) {
    console.log(error);
  }
};

export const saveNFT = async (data) => {
  try {
    const record = await client.records.create('nft_arts', data);
    console.log('records created', record);
  } catch (error) {
    console.log(error);
  }
};
