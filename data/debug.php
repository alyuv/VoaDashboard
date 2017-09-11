<?php

Class voaDebug
{
  private static $instance;
  private $dbg_file;
  private $err_file;
  private $isDebug;

    private function __construct()
    {
        $this->dbg_file = dirname(__FILE__).DIRECTORY_SEPARATOR.'log'.DIRECTORY_SEPARATOR.'debug'.DIRECTORY_SEPARATOR.date('Y-m-d').'.trace.log';
        $this->err_file = dirname(__FILE__).DIRECTORY_SEPARATOR.'log'.DIRECTORY_SEPARATOR.'error'.DIRECTORY_SEPARATOR.date('Y-m-d').'.log';
        $this->isDebug = false;
    }

    public static function getInstance()
    {
      if (!isset(self::$instance)) { $c = __CLASS__; self::$instance = new $c; }
      return self::$instance;
    }

    function setDebug($d)
    {
      $this->isDebug = $d;
    }

    function inDebug()
    {
      return $this->isDebug;
    }


    public function putline($msg='')
    {

      $h = @fopen($this->dbg_file, "a");
      @fwrite($h, date('H:i:s').' '. $msg."\n");
      @fclose($h);
    }

    public function errMsg($err_name='', $err_msg='')
    {
      $h = @fopen($this->err_file, "a");
      @fwrite($h, date('H:i:s')."ERROR: $err_name".' ERROR MESSAGE:'.$err_msg."\n");
      @fclose($h);
    }
}

?>
