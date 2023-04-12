import { useState, useEffect } from 'react';
import { NFTStorage, File } from 'nft.storage';
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// Components
import Spinner from 'react-bootstrap/Spinner';
import Navigation from './components/Navigation';

// ABIs
import NFT from './abis/NFT.json';

// Config
import config from './config.json';
import { getAllNFTs, saveNFT } from './utils';
import NFTtoken from './components/NFTtoken';

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [nft, setNFT] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [url, setURL] = useState(null);

  const [message, setMessage] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);

  const [minedNFTs, setMinedNFTs] = useState([]);

  const [data, setData] = useState({});
  const [minted, setMinted] = useState(false);

  const populateData = (name, value) => {
    setData((values) => ({ ...values, [name]: value }));
  };

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    const network = await provider.getNetwork();

    // '0xcF9CCd758b6e62b2CE2474109396948Cb2ca9DEe',
    const nft = new ethers.Contract(
      // config[network.chainId].nft.address,
      '0xe1db6f95d96F4B4e7cff7A659f73500c18Ee8ff9',
      NFT,
      provider
    );
    setNFT(nft);

    // const name = await nft.name();
    // console.log(name);
  };

  useEffect(() => {
    loadBlockchainData();
    getAllNFTs()
      .then((data) => setMinedNFTs(data))
      .catch((err) => console.log('error', err));
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    console.log(data);

    if (name === '' || description === '') {
      window.alert('Please provide a name and description');
      return;
    }

    setIsWaiting(true);

    // Call AI API to generate a image based on description
    const imageData = await createImage();

    const url = await uploadImage(imageData);

    await mintImage(url);

    setIsWaiting(false);
    setMessage('');
  };

  const createImage = async () => {
    setMessage('Generating Image...');

    // You can replace this with different model API's
    const URL = `https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5`;

    // Send the request
    const response = await axios({
      url: URL,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        inputs: description,
        options: { wait_for_model: true },
      }),
      responseType: 'arraybuffer',
    });

    const type = response.headers['content-type'];
    const data = response.data;

    const base64data = Buffer.from(data).toString('base64');
    const img = `data:${type};base64,` + base64data; // <-- This is so we can render it on the page

    // console.log('img data', img);
    populateData('imgdata', img);
    setImage(img);

    return data;
  };

  const uploadImage = async (imageData) => {
    setMessage('Uploading Image...');

    // Create instance to NFT.Storage
    const nftstorage = new NFTStorage({
      token: process.env.REACT_APP_NFT_STORAGE_API_KEY,
    });

    // Send request to store image
    const { ipnft } = await nftstorage.store({
      image: new File([imageData], 'image.jpeg', { type: 'image/jpeg' }),
      name: name,
      description: description,
    });

    // Save the URL
    const url = `https://ipfs.io/ipfs/${ipnft}/metadata.json`;
    setURL(url);
    // setData({ ...data, metadata: url });
    populateData('metadata', url);
    return url;
  };

  const mintImage = async (tokenURI) => {
    setMessage('Waiting for Mint...');

    const signer = await provider.getSigner();

    const transaction = await nft.connect(signer).mint(tokenURI);

    transaction.wait().then((tx) => {
      if (tx?.status === 1) {
        alert('Transaction Confirmed and sent to address:' + tx?.to);

        populateData('address', tx?.from);
        populateData('to', tx?.to);
        setMinted(true);
      } else {
        alert('Transaction Failed');
      }
    });
    // saveNFT(data);
  };

  useEffect(() => {
    if (minted) {
      saveNFT(data);
    }
    return () => {
      setMinted(false);
    };
  }, [minted]);

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />

      <Toaster />
      <div className="form">
        <form onSubmit={submitHandler}>
          <input
            type="text"
            placeholder="Create a name..."
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
          <input
            type="text"
            placeholder="Create a description..."
            onChange={(e) => setDescription(e.target.value)}
          />
          <input type="submit" value="Create & Mint" />
          {data.to?.length && (
            <p>
              Transaction Confirmed to: <br />
              {data.to}
            </p>
          )}
        </form>

        <div className="image">
          {!isWaiting && image ? (
            <img src={image} alt="AI generated image" />
          ) : isWaiting ? (
            <div className="image__placeholder">
              <Spinner animation="border" />
              <p>{message}</p>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
      {!isWaiting && url && (
        <p>
          View&nbsp;
          <a href={url} target="_blank" rel="noreferrer">
            Metadata
          </a>
        </p>
      )}
      <div className="show_nfts">
        {minedNFTs?.length > 0 && minedNFTs.map((el) => <NFTtoken data={el} />)}
      </div>
    </div>
  );
}

export default App;
