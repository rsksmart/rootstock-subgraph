delete from "sgd1"."candle_stick_day"
where vid not in (
select distinct on ("id")
    vid
from "sgd1"."candle_stick_day"
order by "id", vid desc );

delete from "sgd1"."candle_stick_four_hour"
where vid not in (
select distinct on ("id")
    vid
from "sgd1"."candle_stick_four_hour"
order by "id", vid desc );

delete from "sgd1"."candle_stick_hour"
where vid not in (
select distinct on ("id")
    vid
from "sgd1"."candle_stick_hour"
order by "id", vid desc );

delete from "sgd1"."candle_stick_fifteen_minute"
where vid not in (
select distinct on ("id")
    vid
from "sgd1"."candle_stick_fifteen_minute"
order by "id", vid desc );

delete from "sgd1"."candle_stick_minute"
where vid not in (
select distinct on ("id")
    vid
from "sgd1"."candle_stick_minute"
order by "id", vid desc );