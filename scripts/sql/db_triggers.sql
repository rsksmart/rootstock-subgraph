
-- MINUTE CANDLES

create or replace function DeleteMinuteCandles() 
  returns trigger
    LANGUAGE PLPGSQL
    AS
  $$
  BEGIN
  delete
  from "sgd1"."candle_stick_minute"
  where id = NEW.id
  and vid <> NEW.vid;
  RETURN NEW;
  END;
  $$;

  CREATE or replace TRIGGER delete_minute_candles
  AFTER INSERT ON "sgd1"."candle_stick_minute"
  FOR EACH ROW
  EXECUTE PROCEDURE DeleteMinuteCandles();

-- FIFTEEN MINUTE CANDLES

  create or replace function DeleteFifteenMinuteCandles() 
  returns trigger
  LANGUAGE PLPGSQL
  AS
  $$
  BEGIN
  delete
  from "sgd1"."candle_stick_fifteen_minute"
  where id = NEW.id
  and vid <> NEW.vid;
  RETURN NEW;
  END;
  $$;

  CREATE or replace TRIGGER delete_fifteen_minute_candles
  AFTER INSERT ON "sgd1"."candle_stick_fifteen_minute"
  FOR EACH ROW
  EXECUTE PROCEDURE DeleteFifteenMinuteCandles();

-- HOUR CANDLES

  create or replace function DeleteHourCandles() 
  returns trigger
  LANGUAGE PLPGSQL
  AS
  $$
  BEGIN
  delete
  from "sgd1"."candle_stick_hour"
  where id = NEW.id
  and vid <> NEW.vid;
  RETURN NEW;
  END;
  $$;

  CREATE or replace TRIGGER delete_hour_candles
  AFTER INSERT ON "sgd1"."candle_stick_hour"
  FOR EACH ROW
  EXECUTE PROCEDURE DeleteHourCandles();

-- FOUR HOUR CANDLES

  create or replace function DeleteFourHourCandles() 
  returns trigger
  LANGUAGE PLPGSQL
  AS
  $$
  BEGIN
  delete
  from "sgd1"."candle_stick_four_hour"
  where id = NEW.id
  and vid <> NEW.vid;
  RETURN NEW;
  END;
  $$;

  CREATE or replace TRIGGER delete_four_hour_candles
  AFTER INSERT ON "sgd1"."candle_stick_four_hour"
  FOR EACH ROW
  EXECUTE PROCEDURE DeleteFourHourCandles();

-- DAY CANDLES

  create or replace function DeleteDayCandles() 
  returns trigger
  LANGUAGE PLPGSQL
  AS
  $$
  BEGIN
  delete
  from "sgd1"."candle_stick_day"
  where id = NEW.id
  and vid <> NEW.vid;
  RETURN NEW;
  END;
  $$;

  CREATE or replace TRIGGER delete_day_candles
  AFTER INSERT ON "sgd1"."candle_stick_day"
  FOR EACH ROW
  EXECUTE PROCEDURE DeleteDayCandles();