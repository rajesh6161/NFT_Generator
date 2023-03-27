import copy from 'copy-to-clipboard';
import { toast } from 'react-hot-toast';

const NFTtoken = ({ data }) => {
  return (
    <div className="card">
      <img src={data?.imgdata} alt="AI generated image" className="card__img" />
      <span className="card__footer">
        <p
          className="link"
          onClick={() => {
            copy(data.to);
            toast('Address Copied to clipboard!', {
              duration: 1000,
            });
          }}
        >
          {data.to}
        </p>
      </span>
      {/* <span className="card__action">
        <svg viewBox="0 0 448 512" title="play">
          <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z" />
        </svg>
      </span> */}
    </div>
  );
};

export default NFTtoken;
