CREATE OR REPLACE FUNCTION zscore(value FLOAT, mean FLOAT, stddev FLOAT)
RETURNS FLOAT
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
HANDLER = 'run'
AS
$$
def run(value, mean, stddev):
    if stddev == 0:
        return 0.0
    return (value - mean) / stddev
$$;
