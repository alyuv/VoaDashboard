<?php
require_once 'voaconfig.php';
require_once 'PgDb.php';
require_once 'debug.php';

class Voa
{
    private $dt_receive;     //date time recive ten-packtime
    private $id;             //id voa
    private $location;       //place
    private $temperature;    //temperature voa
    private $power;          //power
    private $status;         //status voa
    private $dt_begin;       //date time beginning of the formation of a ten-packtime
    private $rainfall;       //rainfall
    private $rainsum;        //rain sum

    private $dbg;
    private $sql_params;

    function __construct()
    {
        $this->dbg = voaDebug::getInstance();
        //$this->dbg->setDebug( $_SESSION['voaDebug'] == true );
        //$this->dbg->setDebug(true);

        $this->dt_receive  = '';
        $this->id          = '';
        $this->location    = '';
        $this->temperature = '';
        $this->power       = '';
        $this->status      = '';
        $this->dt_begin    = '';
        $this->rainfall = Array();
        $this->rainsum = '';

        $this->sql_params = Array();
        $this->dbg->putline('Class '.__CLASS__.' created. debug='.$this->dbg->inDebug());
    }


    function get_location($id)
    {
        switch ($id) {
            case 1:
                return "Gostomel";
                break;
            case 2:
                return "Baryshivka";
                break;
            case 3:
                return "Bila Tserkva";
                break;
            case 4:
                return "Oster";
                break;
            default:
                return "Unknown";
        }
    }

    function fetch_last_data_10m()
    {
        date_default_timezone_set("UTC");
        $now = new DateTime();
        $time_end = $now->format('Y-m-d H:i:s');
        $now ->sub(new DateInterval('PT10M'));
        $time_begin =  $now->format('Y-m-d H:i:s');
        $db = PgDb::getPgDb();
        $sql = "SELECT min(datetime), message "
               ."FROM messages WHERE (messages.datetime between '$time_begin' and '$time_end') "
               ."and (message not like '%-01 -01 -01 -01 -01 -01 -01 -01 -01 -01%')"
               ."and (message not like '%ALARM!%') GROUP BY message ORDER BY min(datetime)";
        try
        {
            $result = $db->query($sql);
            $num = pg_num_rows($result);
        }
        catch (Exception $e)
        {
            $this->dbg->errMsg('Last data exec. exception', $e->getMessage());
            return false;
        }

        $json_data = '{"cols": ['
          //{"type": "datetime", "label": "Now Time"},'
       . '{"type": "number","label": "ID"},'
       . '{"type": "string","label": "Location"},'
       . '{"type": "datetime", "label": "Receive time"},'
       . '{"type": "string","label": "Start time"},'
       . '{"type": "number","label": "Pr sum"},'
       . '{"type": "number","label": "0 min"},'
       . '{"type": "number","label": "1 min"},'
       . '{"type": "number","label": "2 min"},'
       . '{"type": "number","label": "3 min"},'
       . '{"type": "number","label": "4 min"},'
       . '{"type": "number","label": "5 min"},'
       . '{"type": "number","label": "6 min"},'
       . '{"type": "number","label": "7 min"},'
       . '{"type": "number","label": "8 min"},'
       . '{"type": "number","label": "9 min"},'
       . '{"type": "number","label": "TMP, C"},'
       . '{"type": "number","label": "Power, mV"},'
       . '{"type": "string","label": "Status"}],"rows": [';

        while($row = pg_fetch_array($result,NULL, PGSQL_ASSOC))
        {
            //print_r("<br/>".$row["min"]);
            $this->id          = substr($row["message"], 5, 3);
            $this->temperature = substr($row["message"], 9, 3);
            $this->power       = substr($row["message"], 13, 3);
            $this->status      = substr($row["message"], 17, 3);
            $this->dt_begin    = substr($row["message"], 21, 17);
            $this->dt_receive  = substr($row["min"], 0, 19);
            //$this->dt_receive = date('H:i', round(strtotime($this->dt_receive)/60)*60);

            //echo $this->rainfall[] = substr($row["message"], 39, 39).'<br>';
            $this->rainfall = explode(" ", substr($row["message"], 39, 39));

            for ($i = 0; $i < 10; $i++)
            {
               if ($this->rainfall[$i] >= 0)
                {
                     $this->rainfall[$i] = $this->rainfall[$i] * 0.1 ;
                     $this->rainsum = $this->rainsum + $this->rainfall[$i];
                }
            }

            $strtime = round(strtotime($this->dt_receive)/60)*60;
            $datetime = number_format($strtime*1000, 0, '.', '');

            $json_data .= '{"c": ['
                . '{"v": "' . $this->id . '"},'
                . '{"v": "' . $this->get_location($this->id) . '"},'
                . '{"v": "Date(' . date('Y,m,d,H,i,s', strtotime($this->dt_receive)) . ')"},'
                . '{"v": "' . $this->dt_begin . '"},'
                . '{"v": "' . $this->rainsum . '"},'
                . '{"v": "' . $this->rainfall[0] . '"},'
                . '{"v": "' . $this->rainfall[1] . '"},'
                . '{"v": "' . $this->rainfall[2] . '"},'
                . '{"v": "' . $this->rainfall[3] . '"},'
                . '{"v": "' . $this->rainfall[4] . '"},'
                . '{"v": "' . $this->rainfall[5] . '"},'
                . '{"v": "' . $this->rainfall[6] . '"},'
                . '{"v": "' . $this->rainfall[7] . '"},'
                . '{"v": "' . $this->rainfall[8] . '"},'
                . '{"v": "' . $this->rainfall[9] . '"},'
                . '{"v": "' . $this->temperature . '"},'
                . '{"v": "' . $this->power . '"},'
                . '{"v": "' . $this->status . '"}]},';

            $this->rainfall = Array();
            $this->rainsum = 0;

        }

        $json_data = rtrim($json_data, ',') . ']}';
        $db = null;
        echo $json_data;
    }

    function fetch_last_data_m($interval, $idvoa)
    {
        $rainsum = 0;
        date_default_timezone_set("UTC");
        $now = new DateTime(); //$now = getdate();
        $time_end = $now->format('Y-m-d H:i:s');
        $now ->sub(new DateInterval('PT'.$interval.'M')); //$now ->add(new DateInterval('PT10M'));
        $time_begin =  $now->format('Y-m-d H:i:s');
        $db = PgDb::getPgDb();
        $sql = "SELECT min(datetime), message "
               ."FROM messages WHERE (datetime between '$time_begin' and '$time_end') and (message like 'msg=*00$idvoa%')"  //select id voa
               ."and (message not like '%-01 -01 -01 -01 -01 -01 -01 -01 -01 -01%') "
               ."and (message not like '%ALARM!%') GROUP BY message ORDER BY min(datetime)" ;
        try
        {
            $result = $db->query($sql);
            $num = pg_num_rows($result);
        }
        catch (Exception $e)
        {
            $this->dbg->errMsg('Last data exec. exception', $e->getMessage());
            return false;
        }

        while($row = pg_fetch_array($result, NULL, PGSQL_ASSOC))
        {
            preg_match("/\d{2}\.\d{2}\.\d{2}\s\d{2}:\d{2}:\d{3}/", $row["message"], $regs);
            if (sizeof($regs)>0)
            {
                $this->rainfall = explode(" ", substr($row["message"], 40, 39));
            }
            else
            {
                $this->rainfall = explode(" ", substr($row["message"], 39, 39));
            }

            for ($i = 0; $i < 10; $i++)
            {
               if ($this->rainfall[$i] >= 0)
                {
                     $this->rainfall[$i] = $this->rainfall[$i] * 0.1 ;
                     $rainsum = $rainsum + $this->rainfall[$i];
                }
            }

            $this->rainfall = Array();

        }

        return $rainsum;
    }

    function fetch_data_json()
    {
        $json_data = '{"cols": ['
        . '{"type": "number","label": "ID"},'
        . '{"type": "string","label": "Location"},'
        . '{"type": "number","label": "PR 10M"},'
        . '{"type": "number","label": "PR 01H"},'
        . '{"type": "number","label": "PR 03H"},'
        . '{"type": "number","label": "PR 06H"},'
        . '{"type": "number","label": "PR 12H"},'
        . '{"type": "number","label": "PR 24H"}],"rows": [';

        for ($i = 1; $i <=4; $i++)
        {
            $json_data .= '{"c": ['
                . '{"v": "' . $i . '"},'
                . '{"v": "' . $this->get_location($i) . '"},'
                . '{"v": "' . $this->fetch_last_data_m(10, $i) . '"},'
                . '{"v": "' . $this->fetch_last_data_m(60, $i) . '"},'
                . '{"v": "' . $this->fetch_last_data_m(3*60, $i) . '"},'
                . '{"v": "' . $this->fetch_last_data_m(6*60, $i) . '"},'
                . '{"v": "' . $this->fetch_last_data_m(12*60, $i) . '"},'
                . '{"v": "' . $this->fetch_last_data_m(24*60, $i) . '"}]},';
        }

        $json_data = rtrim($json_data, ',') . ']}';
        echo $json_data;

    }

    function fetch_data_period($from, $to, $idvoa)
    {
        $rainsum = 0;
        date_default_timezone_set("UTC");
        $db = PgDb::getPgDb();
        $sql = "SELECT min(datetime), message "
               ."FROM messages WHERE (messages.datetime between '$from' and '$to') and (message like 'msg=*00$idvoa%')"  //select id voa
               ." and (message not like '%-01 -01 -01 -01 -01 -01 -01 -01 -01 -01%') "
               ."and (message not like '%ALARM!%') GROUP BY message ORDER BY min(datetime)";
        try
        {
            $result = $db->query($sql);
            $num = pg_num_rows($result);
        }
        catch (Exception $e)
        {
            $this->dbg->errMsg('Last data exec. exception', $e->getMessage());
            return false;
        }

        $json_data = '{"cols": ['
        . '{"type": "datetime", "label": "Receive time"},'
        . '{"type": "number","label": "ID"},'
        . '{"type": "number","label": "Precipation"}],"rows": [';

        while($row = pg_fetch_array($result, NULL, PGSQL_ASSOC))
        {

            $this->dt_receive  = substr($row["min"], 0, 19);

            preg_match("/\d{2}\.\d{2}\.\d{2}\s\d{2}:\d{2}:\d{3}/", $row["message"], $regs);
            if (sizeof($regs)>0)
            {
                $this->rainfall = explode(" ", substr($row["message"], 40, 39));
            }
            else
            {
                $this->rainfall = explode(" ", substr($row["message"], 39, 39));
            }

            for ($i = 0; $i < 10; $i++)
            {
                if ($this->rainfall[$i] >= 0)
                {
                     $this->rainfall[$i] = $this->rainfall[$i] * 0.1 ;
                     $rainsum = $rainsum + $this->rainfall[$i];
                }
            }

            $strtime = round(strtotime($this->dt_receive)/60)*60;
            $datetime = number_format($strtime*1000, 0, '.', '');

            $json_data .= '{"c": ['
                . '{"v": "Date(' . date('Y,m,d,H,i,s', strtotime($this->dt_receive)) . ')"},'
                . '{"v": "' . $idvoa . '"},'
                . '{"v": "' . $rainsum . '"}]},';

            $rainsum = 0;
            $this->rainfall = Array();

        }

        $json_data = rtrim($json_data, ',') . ']}';
        echo $json_data;
    }

}