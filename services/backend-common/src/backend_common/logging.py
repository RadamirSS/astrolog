import logging
import sys


def setup_logging(service_name: str, level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(service_name)
    if logger.handlers:
        return logger

    logger.setLevel(level)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt=f"%(asctime)s [{service_name}] %(levelname)s %(name)s: %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
    )
    logger.addHandler(handler)
    logger.propagate = False
    return logger
