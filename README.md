# How many buses have front-door access ramps?

>STM stands for Société de transport de Montréal.

_The STM recommends to customers to take bus rides with front-door access._

So, this aggregator shows you per bus line, what is the percentage of buses that are accessible for wheelchairs through their front-door ramp. Compared to the ones having rear-door ramps.

## Installation
If you wish to install it and run it on your local machine, please follow the steps below:

1. `git clone git@github.com:Magellol/stm-accessible-bus-rides.git`
2. `cd stm-accessible-bus-rides`
3. `yarn` — Or `npm i` if you don't use `yarn`.
4. `node --harmony index`

**Make sure you're using at least node 7.2.0 and the `--harmony` flag since this script is using features that may not be available in other versions.**

## Disclaimer
This tool uses the latest data provided by the [STM](http://www.stm.info/en/about/developers). If you see any errors or mistakes, please let me know by opening an issue in this repo. ✌.

This tool also assumes that the data provided by the STM regarding the wheelchair accessibility follows whatever said [on their accessibility page](https://www.stm.info/en/access/using-public-transit-wheelchair).

Quoting
>From now on, all tools giving you access to bus schedules will indicate which buses have front-door ramps.

## License
MIT
