import React, { useState, useEffect } from 'react';
import './SwapForm.css';

// Type for the price data received from the API
interface PriceData {
  currency: string;
  price: number;
}

// Type for the prices state object
interface Prices {
  [key: string]: number;
}

const SwapForm: React.FC = () => {
  const [prices, setPrices] = useState<Prices>({});
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('ETH');
  const [amount, setAmount] = useState<string>('1');
  const [convertedAmount, setConvertedAmount] = useState<string>('');

  useEffect(() => {
    fetch('https://interview.switcheo.com/prices.json')
      .then(response => response.json())
      .then((data: PriceData[]) => {
        const priceData = data.reduce((acc: Prices, item) => {
          if (!acc[item.currency]) { // Keep the first price encountered for a currency
            acc[item.currency] = item.price;
          }
          return acc;
        }, {});
        setPrices(priceData);
        setCurrencies(Object.keys(priceData).sort());
      })
      .catch(error => console.error('Error fetching prices:', error));
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleFromCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFromCurrency(e.target.value);
  };

  const handleToCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setToCurrency(e.target.value);
  };

  useEffect(() => {
    if (amount === '' || Object.keys(prices).length === 0) {
      setConvertedAmount('');
      return;
    }
    const fromPrice = prices[fromCurrency];
    const toPrice = prices[toCurrency];

    if (fromPrice && toPrice) {
      const result = (parseFloat(amount) * fromPrice) / toPrice;
      if (!isNaN(result)) {
        setConvertedAmount(result.toFixed(6));
      } else {
        setConvertedAmount('');
      }
    }
  }, [amount, fromCurrency, toCurrency, prices]);

  const getIconUrl = (currency: string): string => {
    return `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${currency}.svg`;
  };

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const nextSibling = target.nextSibling as HTMLElement;
    if (nextSibling) {
        nextSibling.style.paddingLeft = '10px';
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'inline-block';
    const nextSibling = target.nextSibling as HTMLElement;
    if (nextSibling) {
        nextSibling.style.paddingLeft = '0';
    }
  };

  return (
    <div className="swap-form-container">
      <div className="crypto-symbols">
        <div className="crypto-symbol">₿</div>
        <div className="crypto-symbol">Ξ</div>
        <div className="crypto-symbol">₳</div>
        <div className="crypto-symbol">◎</div>
        <div className="crypto-symbol">Ł</div>
        <div className="crypto-symbol">⟐</div>
        <div className="crypto-symbol">⧫</div>
        <div className="crypto-symbol">◈</div>
        <div className="crypto-symbol">⬟</div>
        <div className="crypto-symbol">⬢</div>
        <div className="crypto-symbol">◉</div>
        <div className="crypto-symbol">⬡</div>
        <div className="crypto-symbol">◎</div>
        <div className="crypto-symbol">⟐</div>
        <div className="crypto-symbol">₿</div>
        <div className="crypto-symbol">Ξ</div>
        <div className="crypto-symbol">₳</div>
        <div className="crypto-symbol">Ł</div>
      </div>
      <div className="swap-form">
        <div className="form-group">
          <label>From</label>
          <div className="input-group">
            <img src={getIconUrl(fromCurrency)} alt={fromCurrency} className="currency-icon" onError={handleImageError} onLoad={handleImageLoad}/>
            <input type="number" value={amount} onChange={handleAmountChange} placeholder="Enter amount" />
            <select value={fromCurrency} onChange={handleFromCurrencyChange}>
              {currencies.map(currency => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="swap-button-container">
          <button onClick={handleSwap} className="swap-button">⇅</button>
        </div>
        <div className="form-group">
          <label>To</label>
          <div className="input-group">
            <img src={getIconUrl(toCurrency)} alt={toCurrency} className="currency-icon" onError={handleImageError} onLoad={handleImageLoad}/>
            <input type="text" value={convertedAmount} readOnly placeholder="Converted amount" />
            <select value={toCurrency} onChange={handleToCurrencyChange}>
              {currencies.map(currency => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapForm;
