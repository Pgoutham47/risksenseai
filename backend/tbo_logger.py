import os
import logging
from logging.handlers import TimedRotatingFileHandler

def setup_logger():
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    log_file = os.path.join(log_dir, "tbo_integration.log")
    
    logger = logging.getLogger("tbo_integration")
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        handler = TimedRotatingFileHandler(log_file, when="midnight", interval=1, backupCount=7)
        formatter = logging.Formatter('[%(asctime)s] [%(levelname)s] [%(module)s] %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        # Also log to console for development
        console = logging.StreamHandler()
        console.setFormatter(formatter)
        logger.addHandler(console)
        
    return logger

logger = setup_logger()
